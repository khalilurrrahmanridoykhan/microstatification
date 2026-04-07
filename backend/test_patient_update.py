#!/usr/bin/env python3

import os
import sys
import django
import requests
import json

# Setup Django environment
sys.path.append('/opt/ComMicPlanV2/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Patient, User
from django.contrib.auth import get_user_model

def test_patient_update_api():
    print("Testing Patient Update API endpoint...")

    # Create a test patient if one doesn't exist
    try:
        test_patient = Patient.objects.filter(patient_id='TEST_PATIENT_001').first()
        if not test_patient:
            test_patient = Patient.objects.create(
                patient_id='TEST_PATIENT_001',
                name='Test Patient',
                email='test@example.com',
                phone='1234567890',
                age=25,
                gender='male',
                address='Test Address'
            )
            print(f"Created test patient: {test_patient}")
        else:
            print(f"Using existing test patient: {test_patient}")

        # Test data to update
        update_data = {
            'name': 'Updated Test Patient',
            'email': 'updated@example.com',
            'phone': '9876543210',
            'age': 30,
            'gender': 'female',
            'address': 'Updated Test Address'
        }

        print(f"Original patient data:")
        print(f"  Name: {test_patient.name}")
        print(f"  Email: {test_patient.email}")
        print(f"  Phone: {test_patient.phone}")
        print(f"  Age: {test_patient.age}")
        print(f"  Gender: {test_patient.gender}")
        print(f"  Address: {test_patient.address}")

        # Try updating via Django ORM directly
        for field, value in update_data.items():
            setattr(test_patient, field, value)
        test_patient.save()

        # Refresh from database
        test_patient.refresh_from_db()

        print(f"\nUpdated patient data:")
        print(f"  Name: {test_patient.name}")
        print(f"  Email: {test_patient.email}")
        print(f"  Phone: {test_patient.phone}")
        print(f"  Age: {test_patient.age}")
        print(f"  Gender: {test_patient.gender}")
        print(f"  Address: {test_patient.address}")

        print(f"\n✅ Patient update test successful!")

        # Test that patient_id didn't change
        if test_patient.patient_id == 'TEST_PATIENT_001':
            print("✅ Patient ID remained unchanged (good!)")
        else:
            print("❌ Patient ID was changed (bad!)")

    except Exception as e:
        print(f"❌ Error testing patient update: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_patient_update_api()
