#!/usr/bin/env python3

import os
import sys
import django

# Setup Django environment
sys.path.append('/opt/ComMicPlanV2/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.views import clean_numeric_field, clean_text_field, create_or_update_patient_from_submission

def test_data_cleaning():
    print("Testing data cleaning functions...")

    # Test numeric field cleaning
    print("\n1. Testing numeric field cleaning:")
    test_cases = [
        ("15_", 15),
        ("25 years", 25),
        ("30.5", 30.5),
        ("abc", None),
        ("", None),
        ("45kg", 45),
        ("20-25", 2025),  # Will extract all digits
    ]

    for input_val, expected in test_cases:
        result = clean_numeric_field(input_val)
        status = "✅" if result == expected else "❌"
        print(f"  {status} '{input_val}' -> {result} (expected: {expected})")

    # Test text field cleaning
    print("\n2. Testing text field cleaning:")
    test_cases = [
        ("  John Doe  ", "John Doe"),
        ("Jane    Smith", "Jane Smith"),
        ("", None),
        ("   ", None),
        ("Male", "Male"),
    ]

    for input_val, expected in test_cases:
        result = clean_text_field(input_val)
        status = "✅" if result == expected else "❌"
        print(f"  {status} '{input_val}' -> '{result}' (expected: '{expected}')")

def test_patient_creation_with_problematic_data():
    print("\n3. Testing patient creation with problematic data:")

    # Simulate the exact data from the logs
    submission_data = {
        'diagnostic_information': {
            'patient_id_type': 'nid',
            'user_identification_11_9943_01976848561': '21',
        },
        'patient_information': {
            'patient_name': 'sdf',
            'age': '15_',  # This was causing the error
            'gender': 'male',
            'phone_number': '01876848513',
        },
        'other_data': 'some_value'
    }

    print("Input data:", submission_data)

    # Try to create patient
    try:
        patient = create_or_update_patient_from_submission(submission_data)
        if patient:
            print(f"✅ SUCCESS: Created/updated patient {patient.patient_id} - {patient.name}")
            print(f"   Age: {patient.age} (type: {type(patient.age)})")
            print(f"   Gender: {patient.gender}")
            print(f"   Phone: {patient.phone}")
        else:
            print("❌ FAILED: Patient creation returned None")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    test_data_cleaning()
    test_patient_creation_with_problematic_data()
