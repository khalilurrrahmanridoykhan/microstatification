#!/usr/bin/env python
"""
Delete remaining submissions with dates before Oct 6, 2025
Checks BOTH 'date' and 'end' fields
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
from api.models import Form

def parse_date(date_str):
    """Parse date string to datetime object"""
    if not date_str:
        return None
    try:
        # Handle various date formats
        if 'T' in date_str:
            # ISO format with time
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        else:
            # Just date
            dt = datetime.strptime(date_str, '%Y-%m-%d')

        # Make timezone aware if needed
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt)

        return dt
    except Exception as e:
        print(f"  Warning: Could not parse date '{date_str}': {e}")
        return None

def main():
    cutoff_date = timezone.make_aware(datetime(2025, 10, 6))

    print("=" * 80)
    print("DELETE REMAINING OLD SUBMISSIONS - BASED ON BOTH DATE AND END FIELDS")
    print("=" * 80)
    print(f"Cutoff Date: Before October 6, 2025")
    print()

    print("Loading Form 1079...")
    form_1079 = Form.objects.get(id=1079)

    if not form_1079.submission or not isinstance(form_1079.submission, list):
        print("No submissions found in Form 1079")
        return

    print(f"Total submissions in Form 1079: {len(form_1079.submission)}")
    print()

    # Filter submissions
    submissions_to_keep = []
    submissions_to_remove = []

    print("Analyzing submissions...")
    for idx, sub in enumerate(form_1079.submission):
        try:
            data = sub.get('data', {})
            date_field = data.get('date', '')
            end_field = data.get('end', '')

            # Parse dates
            date_dt = parse_date(date_field)
            end_dt = parse_date(end_field)

            # Check if EITHER date or end is before cutoff
            should_remove = False
            removal_reason = []

            if date_dt and date_dt < cutoff_date:
                should_remove = True
                removal_reason.append(f"date={date_field}")

            if end_dt and end_dt < cutoff_date:
                should_remove = True
                removal_reason.append(f"end={end_field}")

            if should_remove:
                submissions_to_remove.append({
                    'index': idx,
                    'date': date_field,
                    'end': end_field,
                    'hh_id': data.get('hh_id', ''),
                    'hh_head_name': data.get('hh_head_name', ''),
                    'reason': ', '.join(removal_reason)
                })
            else:
                submissions_to_keep.append(sub)

        except Exception as e:
            print(f"  Warning: Error processing submission {idx}: {e}")
            submissions_to_keep.append(sub)

    print()
    print("=" * 80)
    print("SUMMARY:")
    print("=" * 80)
    print(f"Total submissions: {len(form_1079.submission)}")
    print(f"Submissions to remove: {len(submissions_to_remove)}")
    print(f"Submissions to keep: {len(submissions_to_keep)}")
    print()

    if submissions_to_remove:
        print("Submissions to be removed:")
        print("-" * 80)
        for sub in submissions_to_remove[:10]:
            print(f"  Date: {sub['date']}, End: {sub['end']}")
            print(f"    HH ID: {sub['hh_id']}, Name: {sub['hh_head_name']}")
            print(f"    Reason: {sub['reason']}")

        if len(submissions_to_remove) > 10:
            print(f"  ... and {len(submissions_to_remove) - 10} more")
        print()

    # Confirmation
    confirmation = input("⚠️  Do you want to proceed? Type 'YES' to confirm: ")

    if confirmation != 'YES':
        print("❌ Operation cancelled by user")
        return

    print()
    print("=" * 80)
    print("REMOVING SUBMISSIONS...")
    print("=" * 80)

    try:
        with transaction.atomic():
            form_1079.submission = submissions_to_keep
            form_1079.save()

            print()
            print("=" * 80)
            print("✅ DELETION COMPLETED SUCCESSFULLY")
            print("=" * 80)
            print(f"Removed {len(submissions_to_remove)} submissions")
            print(f"Remaining submissions: {len(submissions_to_keep)}")
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
