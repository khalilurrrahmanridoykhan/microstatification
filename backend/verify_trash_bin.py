#!/usr/bin/env python
"""
Quick verification script to check TrashBin functionality.
Run this on your server after deployment to verify everything works.
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import TrashBin, Patient
from django.utils import timezone
from datetime import timedelta

def check_models():
    """Check if all required models are available."""
    print("📋 Checking models...")

    try:
        # Test TrashBin model
        trash_count = TrashBin.objects.count()
        print(f"✅ TrashBin model: {trash_count} items")

        # Test Patient model
        patient_count = Patient.objects.count()
        print(f"✅ Patient model: {patient_count} patients")

        # Test User model
        user_count = User.objects.count()
        print(f"✅ User model: {user_count} users")

        return True
    except Exception as e:
        print(f"❌ Model error: {e}")
        return False

def check_trash_bin_fields():
    """Check if TrashBin has all required fields."""
    print("\n🔍 Checking TrashBin fields...")

    try:
        # Get TrashBin model fields
        from api.models import TrashBin
        field_names = [field.name for field in TrashBin._meta.fields]

        required_fields = [
            'id', 'item_type', 'item_id', 'item_name',
            'item_data', 'deleted_at', 'auto_delete_at', 'deleted_by'
        ]

        for field in required_fields:
            if field in field_names:
                print(f"✅ Field '{field}': Present")
            else:
                print(f"❌ Field '{field}': Missing")
                return False

        return True
    except Exception as e:
        print(f"❌ Field check error: {e}")
        return False

def check_patient_soft_delete():
    """Check if Patient model has soft delete fields."""
    print("\n🔍 Checking Patient soft delete fields...")

    try:
        from api.models import Patient
        field_names = [field.name for field in Patient._meta.fields]

        soft_delete_fields = ['is_deleted', 'deleted_at']

        for field in soft_delete_fields:
            if field in field_names:
                print(f"✅ Patient field '{field}': Present")
            else:
                print(f"❌ Patient field '{field}': Missing")
                return False

        return True
    except Exception as e:
        print(f"❌ Patient field check error: {e}")
        return False

def check_api_endpoints():
    """Check if trash bin API endpoints are available."""
    print("\n🌐 Checking API endpoints...")

    try:
        from django.urls import reverse
        from django.test import Client

        client = Client()

        # Check if trash bin endpoints exist in URL configuration
        try:
            trash_url = reverse('trashbin-list')
            print(f"✅ TrashBin API endpoint: {trash_url}")
        except:
            print("❌ TrashBin API endpoints not found in URL configuration")
            return False

        return True
    except Exception as e:
        print(f"❌ API endpoint check error: {e}")
        return False

def check_utilities():
    """Check if trash bin utility functions are available."""
    print("\n🔧 Checking utility functions...")

    try:
        from api.utils import move_to_trash, restore_from_trash, cleanup_expired_trash
        print("✅ move_to_trash function: Available")
        print("✅ restore_from_trash function: Available")
        print("✅ cleanup_expired_trash function: Available")
        return True
    except ImportError as e:
        print(f"❌ Utility functions error: {e}")
        return False

def run_verification():
    """Run all verification checks."""
    print("🗑️ TrashBin Functionality Verification")
    print("=" * 50)

    checks = [
        ("Models", check_models),
        ("TrashBin Fields", check_trash_bin_fields),
        ("Patient Soft Delete", check_patient_soft_delete),
        ("API Endpoints", check_api_endpoints),
        ("Utility Functions", check_utilities),
    ]

    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name} check failed with exception: {e}")
            results.append((name, False))

    print("\n📊 Verification Summary")
    print("=" * 30)
    all_passed = True
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{name}: {status}")
        if not passed:
            all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All checks passed! TrashBin functionality is ready.")
        print("\nYou can now:")
        print("- Access /trash-bin in the web interface")
        print("- Use trash bin APIs for soft deletion")
        print("- Set up automatic cleanup with Celery")
    else:
        print("❌ Some checks failed. Please review the errors above.")
        print("\nTroubleshooting:")
        print("1. Make sure migrations are applied: python manage.py migrate")
        print("2. Check if all TrashBin files are uploaded to server")
        print("3. Restart the web server after applying changes")

    return all_passed

if __name__ == '__main__':
    success = run_verification()
    sys.exit(0 if success else 1)
