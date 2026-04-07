import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


def _safe_int(value, default, minimum, maximum):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    if parsed < minimum or parsed > maximum:
        return default
    return parsed


snapshot_hour = _safe_int(
    getattr(settings, "BRAC_SNAPSHOT_SCHEDULE_HOUR", 1),
    default=1,
    minimum=0,
    maximum=23,
)
snapshot_minute = _safe_int(
    getattr(settings, "BRAC_SNAPSHOT_SCHEDULE_MINUTE", 0),
    default=0,
    minimum=0,
    maximum=59,
)
snapshot_queue = getattr(settings, "BRAC_SNAPSHOT_QUEUE", getattr(settings, "CELERY_TASK_DEFAULT_QUEUE", "celery"))
recovery_interval_minutes = _safe_int(
    getattr(settings, "SUBMISSION_STALE_PROCESSING_RECOVERY_INTERVAL_MINUTES", 2),
    default=2,
    minimum=1,
    maximum=60,
)
default_queue = getattr(settings, "CELERY_TASK_DEFAULT_QUEUE", "celery")

beat_schedule = {
    **getattr(app.conf, "beat_schedule", {}),
}

if getattr(settings, "BRAC_SNAPSHOT_ENABLED", True):
    beat_schedule["generate-daily-brac-project-snapshot"] = {
        "task": "api.tasks.generate_brac_project_snapshot_task",
        "schedule": crontab(hour=snapshot_hour, minute=snapshot_minute),
        "kwargs": {"project_id": int(getattr(settings, "BRAC_DOWNLOAD_PROJECT_ID", 55))},
        "options": {"queue": snapshot_queue},
    }

if getattr(settings, "SUBMISSION_STALE_PROCESSING_RECOVERY_ENABLED", True):
    beat_schedule["recover-stale-submission-processing"] = {
        "task": "api.tasks.recover_stale_processing_submissions_task",
        "schedule": crontab(minute=f"*/{recovery_interval_minutes}"),
        "options": {"queue": default_queue},
    }

app.conf.beat_schedule = beat_schedule
