from django.conf import settings
from django.core.management.base import BaseCommand

from api.tasks import generate_brac_project_snapshot_task
from api.views import BRAC_DOWNLOAD_DEFAULT_FIELDS, _build_brac_xlsx_file


class Command(BaseCommand):
    help = "Generate BRAC XLSX prepared snapshot for fast download."

    def add_arguments(self, parser):
        parser.add_argument(
            "--project-id",
            type=int,
            default=int(getattr(settings, "BRAC_DOWNLOAD_PROJECT_ID", 55)),
            help="Project ID for snapshot generation (default: BRAC_DOWNLOAD_PROJECT_ID).",
        )
        parser.add_argument(
            "--enqueue",
            action="store_true",
            help="Enqueue snapshot generation task to Celery instead of running inline.",
        )

    def handle(self, *args, **options):
        project_id = int(options["project_id"])
        if options["enqueue"]:
            async_result = generate_brac_project_snapshot_task.delay(project_id=project_id)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Queued BRAC snapshot generation for project {project_id}. task_id={async_result.id}"
                )
            )
            return

        payload = _build_brac_xlsx_file(
            project_id=project_id,
            selected_fields=list(BRAC_DOWNLOAD_DEFAULT_FIELDS),
            followup_filter="all",
            followup_form_ids=set(),
            persist_snapshot=True,
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Generated BRAC snapshot "
                f"project={project_id} rows={payload.get('row_count')} "
                f"size_bytes={payload.get('snapshot_size_bytes')} "
                f"generated_at={payload.get('generated_at')}"
            )
        )
