#!/usr/bin/env python
"""
Safe Deletion Script - Moves old data to trash bin
Deletes:
- 3,459 submissions from Form 1079 (before Oct 6, 2025)
- 103 generated lookup forms (before Oct 6, 2025)
- 171 patient records linked to these submissions
"""

import os
import sys
import django
from datetime import datetime

# Setup Django environment
sys.path.append('/opt/ComMicPlanV2/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import transaction
from django.utils import timezone
from api.models import Form, Patient, User
from api.views import move_to_trash
import json

def main():
    cutoff_date = timezone.make_aware(datetime(2025, 10, 6))
    admin_user = User.objects.filter(is_superuser=True).first()

    print("=" * 80)
    print("SAFE DELETION SCRIPT - MOVING TO TRASH BIN")
    print("=" * 80)
    print(f"Cutoff Date: Before October 6, 2025")
    print(f"Executing User: {admin_user.username if admin_user else 'System'}")
    print()

    # Step 1: Get the forms to delete
    print("Step 1: Identifying Generated Lookup Forms...")
    forms_to_delete = Form.objects.filter(
        template_id=113,
        created_at__lt=cutoff_date
    ).filter(
        questions__icontains='data_collection_form_uuid'
    )

    forms_count = forms_to_delete.count()
    print(f"Found {forms_count} generated lookup forms to move to trash")

    # Get form IDs for reference
    form_ids = list(forms_to_delete.values_list('id', flat=True))
    print(f"Form IDs: {form_ids[:10]}{'...' if len(form_ids) > 10 else ''}")
    print()

    # Step 2: Get patients to delete
    print("Step 2: Identifying Patient Records...")
    patients_to_delete = Patient.objects.filter(
        submission_data__contains={'_id': 'form_1079'},
        created_at__lt=cutoff_date
    )

    patients_count = patients_to_delete.count()
    print(f"Found {patients_count} patient records to move to trash")

    patient_ids = list(patients_to_delete.values_list('id', flat=True))
    print(f"Patient IDs: {patient_ids[:10]}{'...' if len(patient_ids) > 10 else ''}")
    print()

    # Step 3: Check Form 1079 submissions
    print("Step 3: Checking Form 1079 Submissions...")
    form_1079 = Form.objects.get(id=1079)

    if form_1079.submission and isinstance(form_1079.submission, list):
        # Count submissions before cutoff date
        submissions_to_remove = []
        submissions_to_keep = []

        for idx, sub in enumerate(form_1079.submission):
            try:
                end_date_str = sub.get('data', {}).get('end', '')
                if end_date_str:
                    # Parse the date
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                    end_date = timezone.make_aware(end_date) if timezone.is_naive(end_date) else end_date

                    if end_date < cutoff_date:
                        submissions_to_remove.append(idx)
                    else:
                        submissions_to_keep.append(sub)
                else:
                    submissions_to_keep.append(sub)
            except Exception as e:
                print(f"Warning: Could not parse submission {idx}: {e}")
                submissions_to_keep.append(sub)

        submissions_count = len(submissions_to_remove)
        print(f"Found {submissions_count} submissions to remove from Form 1079")
        print(f"Will keep {len(submissions_to_keep)} submissions")
    else:
        submissions_count = 0
        print("No submissions found in Form 1079")

    print()
    print("=" * 80)
    print("SUMMARY:")
    print("=" * 80)
    print(f"Generated Lookup Forms: {forms_count}")
    print(f"Patient Records: {patients_count}")
    print(f"Form 1079 Submissions: {submissions_count}")
    print(f"Total Items to Move: {forms_count + patients_count}")
    print(f"Total Submission Data to Remove: {submissions_count}")
    print()

    # Confirmation
    confirmation = input("⚠️  Do you want to proceed? Type 'YES' to confirm: ")

    if confirmation != 'YES':
        print("❌ Operation cancelled by user")
        return

    print()
    print("=" * 80)
    print("STARTING DELETION PROCESS...")
    print("=" * 80)

    try:
        with transaction.atomic():
            # Step 4: Move generated lookup forms to trash
            print("\n📦 Step 4: Moving Generated Lookup Forms to Trash...")
            moved_forms = 0
            for form in forms_to_delete:
                try:
                    move_to_trash(form, 'form', admin_user)
                    moved_forms += 1
                    if moved_forms % 10 == 0:
                        print(f"  Moved {moved_forms}/{forms_count} forms...")
                except Exception as e:
                    print(f"  ❌ Error moving form {form.id}: {e}")

            print(f"✅ Moved {moved_forms} forms to trash")

            # Step 5: Move patient records to trash
            print("\n👥 Step 5: Moving Patient Records to Trash...")
            moved_patients = 0
            for patient in patients_to_delete:
                try:
                    move_to_trash(patient, 'patient', admin_user)
                    moved_patients += 1
                    if moved_patients % 10 == 0:
                        print(f"  Moved {moved_patients}/{patients_count} patients...")
                except Exception as e:
                    print(f"  ❌ Error moving patient {patient.id}: {e}")

            print(f"✅ Moved {moved_patients} patient records to trash")

            # Step 6: Remove submissions from Form 1079
            print("\n📝 Step 6: Removing Submissions from Form 1079...")
            if submissions_count > 0:
                form_1079.submission = submissions_to_keep
                form_1079.save()
                print(f"✅ Removed {submissions_count} submissions from Form 1079")
                print(f"   Remaining submissions: {len(submissions_to_keep)}")
            else:
                print("No submissions to remove from Form 1079")

            print()
            print("=" * 80)
            print("✅ DELETION COMPLETED SUCCESSFULLY")
            print("=" * 80)
            print(f"Forms moved to trash: {moved_forms}")
            print(f"Patients moved to trash: {moved_patients}")
            print(f"Submissions removed: {submissions_count}")
            print()
            print("⏰ Items will be auto-deleted after 30 days")
            print("💡 You can restore items from the trash bin within 30 days")
            print()

    except Exception as e:
        print()
        print("=" * 80)
        print("❌ ERROR OCCURRED - TRANSACTION ROLLED BACK")
        print("=" * 80)
        print(f"Error: {e}")
        print("No changes were made to the database")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
