import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from .models import Submission, TrashBin

logger = logging.getLogger(__name__)


@shared_task
def process_submission(submission_id):
    """
    Process expensive submission side effects asynchronously.
    """
    try:
        submission = Submission.objects.select_related('form', 'user').get(id=submission_id)
    except Submission.DoesNotExist:
        return f"Submission {submission_id} not found"

    if submission.processing_status == 'completed':
        return f"Submission {submission_id} already completed"

    Submission.objects.filter(id=submission_id).update(
        processing_status='processing',
        processing_error='',
    )

    try:
        from .views import process_submission_side_effects
        process_submission_side_effects(submission_id)
        Submission.objects.filter(id=submission_id).update(
            processing_status='completed',
            processed_at=timezone.now(),
            processing_error='',
        )
        return f"Processed submission {submission_id}"
    except Exception as exc:
        Submission.objects.filter(id=submission_id).update(
            processing_status='failed',
            processing_error=str(exc)[:4000],
        )
        logger.exception("Failed submission post-processing for submission %s", submission_id)
        raise


@shared_task
def recover_stale_processing_submissions_task():
    """
    Recover submissions stuck in `processing` by re-queuing them.
    """
    stale_minutes = max(
        1,
        int(getattr(settings, "SUBMISSION_STALE_PROCESSING_MINUTES", 30)),
    )
    batch_size = max(
        1,
        int(getattr(settings, "SUBMISSION_STALE_PROCESSING_RECOVERY_BATCH_SIZE", 200)),
    )
    cutoff = timezone.now() - timedelta(minutes=stale_minutes)

    stale_ids = list(
        Submission.objects.filter(
            processing_status="processing",
            created_at__lt=cutoff,
            is_deleted=False,
        )
        .order_by("created_at")
        .values_list("id", flat=True)[:batch_size]
    )

    if not stale_ids:
        return {"recovered": 0, "stale_minutes": stale_minutes}

    Submission.objects.filter(id__in=stale_ids).update(
        processing_status="queued",
        processing_error="Recovered from stale processing state",
    )

    submit_queue = getattr(settings, "SUBMISSION_CELERY_QUEUE", "submission_processing")
    for submission_id in stale_ids:
        process_submission.apply_async(args=[submission_id], queue=submit_queue)

    logger.warning(
        "Recovered %s stale processing submissions and re-queued them to %s",
        len(stale_ids),
        submit_queue,
    )
    return {
        "recovered": len(stale_ids),
        "submission_ids": stale_ids,
        "stale_minutes": stale_minutes,
        "queue": submit_queue,
    }


@shared_task
def cleanup_expired_trash_task():
    """
    Celery task to automatically cleanup expired items from trash bin
    This should be scheduled to run daily
    """
    try:
        from .views import cleanup_expired_trash
        count = cleanup_expired_trash()
        return f"Cleaned up {count} expired items from trash bin"
    except Exception as e:
        return f"Error during trash cleanup: {str(e)}"


@shared_task
def send_trash_expiry_notifications():
    """
    Send notifications for items expiring soon (7 days before expiration)
    """
    from datetime import timedelta

    expiring_soon = TrashBin.objects.filter(
        auto_delete_at__lte=timezone.now() + timedelta(days=7),
        auto_delete_at__gt=timezone.now(),
        restored=False
    )

    notifications = []
    for item in expiring_soon:
        days_left = (item.auto_delete_at - timezone.now()).days
        notifications.append({
            'item_type': item.get_item_type_display(),
            'item_name': item.item_name,
            'days_left': days_left,
            'deleted_by': item.deleted_by.username if item.deleted_by else 'Unknown'
        })

    # Here you would send actual notifications (email, in-app, etc.)
    # For now, just return the data
    return f"Found {len(notifications)} items expiring within 7 days"


@shared_task
def generate_brac_project_snapshot_task(project_id=None):
    """
    Generate and persist the BRAC XLSX snapshot for fast download.
    """
    target_project_id = int(project_id or getattr(settings, "BRAC_DOWNLOAD_PROJECT_ID", 55))
    try:
        from .views import BRAC_DOWNLOAD_DEFAULT_FIELDS, _build_brac_xlsx_file

        payload = _build_brac_xlsx_file(
            project_id=target_project_id,
            selected_fields=list(BRAC_DOWNLOAD_DEFAULT_FIELDS),
            followup_filter="all",
            followup_form_ids=set(),
            persist_snapshot=True,
        )
        logger.info(
            "Generated BRAC snapshot project=%s rows=%s size_bytes=%s",
            target_project_id,
            payload.get("row_count"),
            payload.get("snapshot_size_bytes"),
        )
        return {
            "project_id": target_project_id,
            "row_count": payload.get("row_count"),
            "snapshot_size_bytes": payload.get("snapshot_size_bytes"),
            "generated_at": payload.get("generated_at"),
        }
    except Exception:
        logger.exception("Failed to generate BRAC snapshot for project=%s", target_project_id)
        raise
