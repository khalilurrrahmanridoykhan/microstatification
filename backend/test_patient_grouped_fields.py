#!/usr/bin/env python3
"""
Test script to verify that patient creation works with grouped fields.
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append('/Users/khalilur/Documents/ComMicPlanV2/backend')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Setup Django
django.setup()

# Now import Django models and functions
from api.views import create_or_update_patient_from_submission
from django.contrib.auth.models import User

def test_grouped_fields():
    """Test patient creation with grouped fields"""

    # Test data with grouped fields (simulating ODK group submission)
    test_data_grouped = {
        "diagnostic_information/patient_id_type": "nid",
        "diagnostic_information/user_identification_11_9943_01976848561": "1234567890123",
        "diagnostic_information/patient_name": "John Doe",
        "diagnostic_information/patient_age": "30",
        "other_field": "some_value"
    }

    # Test data with direct fields (non-grouped)
    test_data_direct = {
        "patient_id_type": "birth_id",
        "user_identification_11_9943_01976848561": "0987654321098",
        "patient_name": "Jane Smith",
        "patient_age": "25",
        "other_field": "some_value"
    }

    # Test data with nested structure
    test_data_nested = {
        "diagnostic_information": {
            "patient_id_type": "vaccine_card",
            "user_identification_11_9943_01976848561": "VACC123456789",
            "patient_name": "Bob Wilson",
            "patient_age": "35"
        },
        "other_field": "some_value"
    }

    # Get a test user (or create one)
    user, created = User.objects.get_or_create(
        username='test_user',
        defaults={'email': 'test@example.com'}
    )

    print("Testing patient creation with grouped fields...")

    # Test 1: Grouped fields with slash notation
    print("\n1. Testing grouped fields with slash notation:")
    print(f"Input data: {test_data_grouped}")
    patient1 = create_or_update_patient_from_submission(test_data_grouped, user)
    if patient1:
        print(f"✅ SUCCESS: Created patient {patient1.patient_id} - {patient1.name}")
    else:
        print("❌ FAILED: No patient created")

    # Test 2: Direct fields
    print("\n2. Testing direct fields:")
    print(f"Input data: {test_data_direct}")
    patient2 = create_or_update_patient_from_submission(test_data_direct, user)
    if patient2:
        print(f"✅ SUCCESS: Created patient {patient2.patient_id} - {patient2.name}")
    else:
        print("❌ FAILED: No patient created")

    # Test 3: Nested structure
    print("\n3. Testing nested structure:")
    print(f"Input data: {test_data_nested}")
    patient3 = create_or_update_patient_from_submission(test_data_nested, user)
    if patient3:
        print(f"✅ SUCCESS: Created patient {patient3.patient_id} - {patient3.name}")
    else:
        print("❌ FAILED: No patient created")

    print("\nTest completed!")

if __name__ == "__main__":
    test_grouped_fields()
