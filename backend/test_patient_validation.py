#!/usr/bin/env python3

import os
import sys
import django
import json

# Setup Django environment
sys.path.append('/opt/ComMicPlanV2/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Patient, User
from api.serializers import PatientSerializer
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

def test_patient_serializer_validation():
    print("Testing Patient Serializer Validation...")

    # Create a test patient
    test_patient = Patient.objects.create(
        patient_id='TEST_VALIDATION_001',
        name='Test Patient',
        email='test@example.com',
        phone='1234567890',
        age=25,
        gender='male',
        address='Test Address'
    )

    print(f"Created test patient: {test_patient}")

    # Test various update scenarios
    test_cases = [
        {
            'name': 'Valid update with all fields',
            'data': {
                'name': 'Updated Name',
                'email': 'updated@example.com',
                'phone': '9876543210',
                'age': 30,
                'gender': 'female',
                'address': 'Updated Address'
            }
        },
        {
            'name': 'Update with empty age (should become None)',
            'data': {
                'name': 'Updated Name',
                'age': ''
            }
        },
        {
            'name': 'Update with empty email (should become None)',
            'data': {
                'name': 'Updated Name',
                'email': ''
            }
        },
        {
            'name': 'Update with invalid age',
            'data': {
                'name': 'Updated Name',
                'age': 'invalid_age'
            }
        },
        {
            'name': 'Update with age out of range',
            'data': {
                'name': 'Updated Name',
                'age': 200
            }
        }
    ]

    for test_case in test_cases:
        print(f"\n--- Testing: {test_case['name']} ---")

        serializer = PatientSerializer(test_patient, data=test_case['data'], partial=True)

        try:
            if serializer.is_valid():
                print(f"✅ Validation passed")
                print(f"   Validated data: {serializer.validated_data}")
                # Don't actually save in this test
            else:
                print(f"❌ Validation failed")
                print(f"   Errors: {serializer.errors}")
        except Exception as e:
            print(f"❌ Exception during validation: {e}")

    # Clean up
    test_patient.delete()
    print(f"\nTest patient deleted.")

def test_api_endpoint():
    print("\n" + "="*50)
    print("Testing API Endpoint...")

    # Create test user and patient
    User = get_user_model()
    test_user, created = User.objects.get_or_create(
        username='test_api_user',
        defaults={'email': 'test@example.com'}
    )

    test_patient = Patient.objects.create(
        patient_id='TEST_API_001',
        name='API Test Patient',
        email='api@example.com',
        phone='1111111111',
        age=35,
        gender='male',
        address='API Test Address',
        created_by=test_user
    )

    # Test API client
    client = APIClient()
    client.force_authenticate(user=test_user)

    update_data = {
        'name': 'Updated API Patient',
        'email': 'updated_api@example.com',
        'age': 40
    }

    print(f"Making PUT request to /api/patients/{test_patient.id}/")
    print(f"Update data: {update_data}")

    response = client.put(
        f'/api/patients/{test_patient.id}/',
        data=json.dumps(update_data),
        content_type='application/json'
    )

    print(f"Response status: {response.status_code}")
    print(f"Response data: {response.data}")

    if response.status_code == 200:
        print("✅ API update successful")

        # Verify the update
        test_patient.refresh_from_db()
        print(f"Updated patient name: {test_patient.name}")
        print(f"Updated patient email: {test_patient.email}")
        print(f"Updated patient age: {test_patient.age}")
    else:
        print("❌ API update failed")

    # Clean up
    test_patient.delete()
    test_user.delete()
    print("Test data cleaned up.")

if __name__ == "__main__":
    test_patient_serializer_validation()
    test_api_endpoint()
