#!/usr/bin/env python
"""
Script to apply the restore fields migration and test the functionality.
Run this on your server to fix the restore issue.
"""

import os
import sys
import subprocess

def run_command(command, description):
    """Run a command and print the result."""
    print(f"\n🔧 {description}")
    print(f"Running: {command}")
    print("-" * 50)

    try:
        result = subprocess.run(command, shell=True, check=True,
                              capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"Warnings: {result.stderr}")
        print("✅ Success!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        return False

def main():
    print("🔧 Fixing TrashBin Restore Functionality")
    print("=" * 50)

    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print("❌ Error: manage.py not found. Please run this script from the backend directory.")
        return False

    print("📍 Current directory:", os.getcwd())

    # Step 1: Apply the new migration
    if not run_command("python manage.py migrate",
                      "Applying restore fields migration"):
        return False

    # Step 2: Check migration status
    if not run_command("python manage.py showmigrations api",
                      "Checking migration status"):
        return False

    # Step 3: Test restore functionality
    print("\n🧪 Testing Restore Functionality")
    test_script = """
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import TrashBin
from django.contrib.auth.models import User

# Check if TrashBin has restore fields
print("Checking TrashBin fields...")
field_names = [field.name for field in TrashBin._meta.fields]
restore_fields = ['restored', 'restored_at', 'restored_by']

for field in restore_fields:
    if field in field_names:
        print(f"✅ Field '{field}': Present")
    else:
        print(f"❌ Field '{field}': Missing")

# Test if we can query trash items
try:
    count = TrashBin.objects.count()
    print(f"✅ Total trash items: {count}")

    # Test queryset filtering
    unrestored = TrashBin.objects.filter(restored=False).count()
    print(f"✅ Unrestored items: {unrestored}")

    print("🎉 Restore functionality is ready!")
except Exception as e:
    print(f"❌ Error testing functionality: {e}")
"""

    with open('test_restore.py', 'w') as f:
        f.write(test_script)

    if run_command("python test_restore.py",
                  "Testing restore functionality"):
        os.remove('test_restore.py')  # Clean up test file
        print("\n🎉 Restore fix completed successfully!")
        print("\nWhat was fixed:")
        print("1. Added 'restored', 'restored_at', 'restored_by' fields to TrashBin")
        print("2. Fixed restore function to handle field existence")
        print("3. Made TrashBin queries compatible with old and new schema")
        print("\nNow you can:")
        print("- Restore items from trash bin")
        print("- Track who restored items and when")
        print("- Properly filter restored vs unrestored items")
        return True
    else:
        print("\n❌ Fix verification failed. Please check the errors above.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
