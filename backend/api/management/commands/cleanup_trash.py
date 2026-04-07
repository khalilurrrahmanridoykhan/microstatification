from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import TrashBin
from api.views import cleanup_expired_trash


class Command(BaseCommand):
    help = 'Clean up expired items from trash bin (older than 30 days)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force cleanup without confirmation',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']

        # Find expired items
        expired_items = TrashBin.objects.filter(
            auto_delete_at__lte=timezone.now(),
            restored=False
        )

        count = expired_items.count()

        if count == 0:
            self.stdout.write(
                self.style.SUCCESS('No expired items found in trash bin.')
            )
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would delete {count} expired items:')
            )
            for item in expired_items:
                self.stdout.write(f'  - {item.get_item_type_display()}: {item.item_name} (expired {item.auto_delete_at})')
            return

        # Show items to be deleted
        self.stdout.write(f'Found {count} expired items:')
        for item in expired_items:
            days_expired = (timezone.now() - item.auto_delete_at).days
            self.stdout.write(f'  - {item.get_item_type_display()}: {item.item_name} (expired {days_expired} days ago)')

        # Confirm deletion unless forced
        if not force:
            confirm = input(f'\nAre you sure you want to permanently delete these {count} items? (yes/no): ')
            if confirm.lower() not in ['yes', 'y']:
                self.stdout.write(self.style.WARNING('Cleanup cancelled.'))
                return

        # Perform cleanup
        deleted_count = cleanup_expired_trash()

        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {deleted_count} expired items from trash bin.')
        )
