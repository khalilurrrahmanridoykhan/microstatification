from pathlib import Path

import openpyxl
from django.core.management.base import BaseCommand, CommandError

from malaria.microstatification_sync import sync_microstatification_workbook
from malaria.models import District, Union, Upazila, Village


class Command(BaseCommand):
    help = "Load and sync malaria microstatification data from an Excel workbook"

    def add_arguments(self, parser):
        parser.add_argument(
            "excel_file",
            type=str,
            help="Path to the Excel file with microstatification data",
        )
        parser.add_argument(
            "--district",
            default="Bandarban",
            help="District name to sync against",
        )
        parser.add_argument(
            "--no-prune-stale",
            action="store_true",
            help="Keep existing villages that are not present in the workbook",
        )

    def handle(self, *args, **options):
        excel_file = Path(options["excel_file"]).expanduser()
        district_name = str(options["district"]).strip() or "Bandarban"
        prune_stale = not options["no_prune_stale"]

        if not excel_file.exists():
            raise CommandError(f"Excel file not found: {excel_file}")

        self.stdout.write(self.style.SUCCESS(f"Loading data from {excel_file}..."))

        workbook = openpyxl.load_workbook(excel_file)
        sync_result = sync_microstatification_workbook(
            workbook,
            district_name=district_name,
            prune_stale=prune_stale,
        )

        district_count = District.objects.filter(name=district_name).count()
        upazila_count = Upazila.objects.filter(district__name=district_name).count()
        union_count = Union.objects.filter(upazila__district__name=district_name).count()
        village_count = Village.objects.filter(union__upazila__district__name=district_name).count()

        self.stdout.write(
            self.style.SUCCESS(
                "\n".join(
                    [
                        "✓ Data sync completed!",
                        f"Districts created: {sync_result.districts_created}",
                        f"Upazilas created: {sync_result.upazilas_created}",
                        f"Unions created: {sync_result.unions_created}",
                        f"Villages created: {sync_result.villages_created}",
                        f"Villages updated: {sync_result.villages_updated}",
                        f"Villages deleted: {sync_result.villages_deleted}",
                        f"Local records deleted: {sync_result.local_records_deleted}",
                        f"Monthly approvals deleted: {sync_result.monthly_approvals_deleted}",
                        f"Empty unions deleted: {sync_result.unions_deleted}",
                        f"Empty upazilas deleted: {sync_result.upazilas_deleted}",
                        "",
                        f"=== {district_name} Summary ===",
                        f"District rows: {district_count}",
                        f"Upazilas: {upazila_count}",
                        f"Unions: {union_count}",
                        f"Villages: {village_count}",
                    ]
                )
            )
        )
