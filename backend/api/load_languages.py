import os
import sys
import django
import requests
from datetime import datetime

# Add the project directory to the Python path
sys.path.append('/Users/khalilur/Downloads/mycommicplan-main/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Language

def load_language_data():
    url = 'https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry'
    response = requests.get(url)
    data = response.text

    languages = []
    current_language = {}

    for line in data.splitlines():
        if line.startswith('%%'):
            if current_language:
                languages.append(current_language)
            current_language = {}  # Reset for the next language entry
        elif line.startswith('Type:'):
            current_language['type'] = line.split(': ')[1]
        elif line.startswith('Subtag:'):
            current_language['subtag'] = line.split(': ')[1]
        elif line.startswith('Description:'):
            current_language['description'] = line.split(': ')[1]
        elif line.startswith('Added:'):
            try:
                current_language['added'] = datetime.strptime(line.split(': ')[1], '%Y-%m-%d').date()
            except ValueError:
                current_language['added'] = None
        elif line.startswith('Deprecated:'):
            try:
                current_language['deprecated'] = datetime.strptime(line.split(': ')[1], '%Y-%m-%d').date()
            except ValueError:
                current_language['deprecated'] = None

    if current_language:
        languages.append(current_language)

    # Debugging: Print invalid entries
    for language in languages:
        if 'subtag' not in language:
            print("⚠️ Missing 'subtag' in:", language)
            continue  # Skip this entry

        # Insert into DB
        Language.objects.update_or_create(
            subtag=language['subtag'],
            defaults={
                'type': language.get('type', ''),
                'description': language.get('description', ''),
                'added': language.get('added'),
                'deprecated': language.get('deprecated')
            }
        )

if __name__ == '__main__':
    load_language_data()
