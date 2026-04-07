#!/usr/bin/env python
"""
Django management command to test the trash bin functionality.
This command creates test data and demonstrates the trash bin system.
"""

import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Add the project root to the Python path
sys.path.append('/Users/khalilur/Documents/ComMicPlanV2/backend')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import TrashBin, Patient
from api.utils import move_to_trash, restore_from_trash, cleanup_expired_trash

def test_trash_bin_system():
    """Test the complete trash bin system functionality."""

    print("🗑️ Testing Trash Bin System")
    print("=" * 50)

    # Get or create a test user
    user, created = User.objects.get_or_create(
        username='test_user',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
    print(f"✅ Using test user: {user.username}")

    # Create a test patient
    patient = Patient.objects.create(
        patient_id='TEST_PATIENT_001',
        submissions={'test_data': {'name': 'John Doe', 'age': 30}},
        created_by=user
    )
    print(f"✅ Created test patient: {patient.patient_id}")

    # Test 1: Move item to trash
    print("\n📍 Test 1: Moving patient to trash")
    move_to_trash(
        item_type='patient',
        item_id=patient.id,
        item_name=f"Patient {patient.patient_id}",
        deleted_by=user,
        item_data=patient.submissions
    )

    # Check if item is in trash
    trash_item = TrashBin.objects.filter(
        item_type='patient',
        item_id=patient.id
    ).first()

    if trash_item:
        print(f"✅ Patient moved to trash successfully")
        print(f"   - Trash ID: {trash_item.id}")
        print(f"   - Auto-delete date: {trash_item.auto_delete_at}")
        print(f"   - Days until deletion: {trash_item.days_until_deletion}")
    else:
        print("❌ Failed to move patient to trash")
        return

    # Test 2: Restore item from trash
    print("\n📍 Test 2: Restoring patient from trash")
    result = restore_from_trash(trash_item.id)

    if result['success']:
        print(f"✅ Patient restored successfully")
        print(f"   - Message: {result['message']}")

        # Verify patient is restored
        restored_patient = Patient.objects.filter(id=patient.id).first()
        if restored_patient:
            print(f"   - Patient {restored_patient.patient_id} is back in database")
        else:
            print("❌ Patient not found after restoration")
    else:
        print(f"❌ Failed to restore patient: {result['message']}")
        return

    # Test 3: Create expired trash item to test cleanup
    print("\n📍 Test 3: Testing expired item cleanup")

    # Move patient to trash again
    move_to_trash(
        item_type='patient',
        item_id=patient.id,
        item_name=f"Patient {patient.patient_id}",
        deleted_by=user,
        item_data=patient.submissions
    )

    # Manually set the trash item to be expired (simulate 31 days old)
    trash_item = TrashBin.objects.filter(
        item_type='patient',
        item_id=patient.id
    ).first()

    if trash_item:
        # Set auto_delete_at to yesterday to make it expired
        trash_item.auto_delete_at = timezone.now() - timedelta(days=1)
        trash_item.save()
        print(f"✅ Set trash item to expired (auto_delete_at: {trash_item.auto_delete_at})")

        # Test cleanup
        cleanup_result = cleanup_expired_trash()
        print(f"✅ Cleanup completed: {cleanup_result['message']}")
        print(f"   - Items cleaned: {cleanup_result['cleaned_count']}")

        # Verify item is gone from trash
        remaining_trash = TrashBin.objects.filter(
            item_type='patient',
            item_id=patient.id
        ).first()

        if not remaining_trash:
            print("✅ Expired trash item cleaned up successfully")
        else:
            print("❌ Expired trash item still exists")

    # Test 4: Test stats
    print("\n📍 Test 4: Testing trash bin stats")

    # Create some test trash items with different expiry dates
    test_items = [
        {'name': 'Test Item 1', 'days': 5},    # Expiring soon
        {'name': 'Test Item 2', 'days': 15},   # Safe
        {'name': 'Test Item 3', 'days': -1},   # Expired
    ]

    for item in test_items:
        trash = TrashBin.objects.create(
            item_type='project',
            item_id=999,
            item_name=item['name'],
            deleted_by=user,
            item_data={'test': True},
            auto_delete_at=timezone.now() + timedelta(days=item['days'])
        )
        print(f"✅ Created test trash item: {item['name']} (expires in {item['days']} days)")

    # Get stats
    from api.views import TrashBinViewSet
    viewset = TrashBinViewSet()
    stats = viewset.get_stats_data()

    print(f"\n📊 Trash Bin Statistics:")
    print(f"   - Total items: {stats['total_items']}")
    print(f"   - Expired items: {stats['expired_items']}")
    print(f"   - Items by type: {stats['items_by_type']}")

    # Cleanup test data
    print("\n🧹 Cleaning up test data")
    TrashBin.objects.filter(item_data__test=True).delete()
    Patient.objects.filter(patient_id='TEST_PATIENT_001').delete()
    print("✅ Test data cleaned up")

    print("\n🎉 All trash bin tests completed successfully!")
    print("=" * 50)

if __name__ == '__main__':
    test_trash_bin_system()
