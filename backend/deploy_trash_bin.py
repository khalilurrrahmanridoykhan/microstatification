#!/usr/bin/env python
"""
Deployment script for TrashBin functionality on production server.
Run this script to set up the trash bin system.
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
    print("🗑️ Setting up TrashBin functionality on production server")
    print("=" * 60)

    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print("❌ Error: manage.py not found. Please run this script from the backend directory.")
        return False

    print("📍 Current directory:", os.getcwd())

    # Step 1: Create migrations
    if not run_command("python manage.py makemigrations",
                      "Creating new migrations"):
        return False

    # Step 2: Show migrations status
    if not run_command("python manage.py showmigrations api",
                      "Checking migration status"):
        return False

    # Step 3: Apply migrations
    if not run_command("python manage.py migrate",
                      "Applying migrations to database"):
        return False

    # Step 4: Collect static files (if needed)
    run_command("python manage.py collectstatic --noinput",
               "Collecting static files (optional)")

    # Step 5: Test the trash bin system
    print("\n🧪 Testing TrashBin system")
    test_script = """
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import TrashBin
from django.contrib.auth.models import User

# Test if TrashBin model works
print("Testing TrashBin model...")
count = TrashBin.objects.count()
print(f"✅ TrashBin table exists. Current items: {count}")

# Test if User model has the required fields for trash bin
users = User.objects.count()
print(f"✅ User model accessible. Total users: {users}")

print("🎉 TrashBin system is ready!")
"""

    with open('test_setup.py', 'w') as f:
        f.write(test_script)

    if run_command("python test_setup.py",
                  "Testing TrashBin setup"):
        os.remove('test_setup.py')  # Clean up test file
        print("\n🎉 TrashBin setup completed successfully!")
        print("\nNext steps:")
        print("1. Restart your web server (gunicorn/uwsgi)")
        print("2. Test the trash bin functionality in the web interface")
        print("3. Set up Celery beat for automatic cleanup (optional)")
        return True
    else:
        print("\n❌ Setup verification failed. Please check the errors above.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
