from pathlib import Path

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from malaria.microstatification_sync import (
    reset_microstatification_dataset,
    sync_microstatification_csv_directory,
)
from malaria.models import District, LocalRecord, MonthlyApproval, Union, Upazila, Village


class Command(BaseCommand):
    help = "Replace microstatification geography/local records from a directory of CSV files"

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_dir",
            type=str,
            help="Path to a directory containing microstatification CSV files",
        )
        parser.add_argument(
            "--reporting-year",
            type=int,
            default=2026,
            help="Reporting year for imported LocalRecord rows",
        )
        parser.add_argument(
            "--fallback-user",
            default="admin2",
            help="Username to assign when a CSV SK/SHW name does not match an existing user",
        )
        parser.add_argument(
            "--no-reset",
            action="store_true",
            help="Do not delete the existing microstatification geography/local dataset before import",
        )

    def handle(self, *args, **options):
        csv_dir = Path(options["csv_dir"]).expanduser()
        reporting_year = int(options["reporting_year"])
        fallback_username = str(options["fallback_user"]).strip()
        should_reset = not options["no_reset"]

        if not csv_dir.exists():
            raise CommandError(f"CSV directory not found: {csv_dir}")

        fallback_user = None
        if fallback_username:
            fallback_user = User.objects.filter(username=fallback_username).first()
            if fallback_user is None:
                raise CommandError(f"Fallback user not found: {fallback_username}")

        if should_reset:
            reset_result = reset_microstatification_dataset(delete_uploads=True)
            self.stdout.write(
                self.style.WARNING(
                    "\n".join(
                        [
                            "Deleted existing microstatification dataset.",
                            f"Districts deleted: {reset_result.districts_deleted}",
                            f"Upazilas deleted: {reset_result.upazilas_deleted}",
                            f"Unions deleted: {reset_result.unions_deleted}",
                            f"Villages deleted: {reset_result.villages_deleted}",
                            f"Local records deleted: {reset_result.local_records_deleted}",
                            f"Monthly approvals deleted: {reset_result.monthly_approvals_deleted}",
                            f"Upload logs deleted: {reset_result.uploads_deleted}",
                        ]
                    )
                )
            )

        result = sync_microstatification_csv_directory(
            csv_dir,
            reporting_year=reporting_year,
            fallback_user=fallback_user,
        )

        self.stdout.write(
            self.style.SUCCESS(
                "\n".join(
                    [
                        f"Loaded CSV directory: {csv_dir}",
                        f"Files processed: {result.files_processed}",
                        f"Rows processed: {result.rows_processed}",
                        f"Districts created: {result.districts_created}",
                        f"Upazilas created: {result.upazilas_created}",
                        f"Unions created: {result.unions_created}",
                        f"Villages created: {result.villages_created}",
                        f"Villages updated: {result.villages_updated}",
                        f"Local records created: {result.local_records_created}",
                        f"Local records updated: {result.local_records_updated}",
                        "",
                        "=== Current Totals ===",
                        f"Districts: {District.objects.count()}",
                        f"Upazilas: {Upazila.objects.count()}",
                        f"Unions: {Union.objects.count()}",
                        f"Villages: {Village.objects.count()}",
                        f"Local records ({reporting_year}): {LocalRecord.objects.filter(reporting_year=reporting_year).count()}",
                        f"Monthly approvals: {MonthlyApproval.objects.count()}",
                    ]
                )
            )
        )
