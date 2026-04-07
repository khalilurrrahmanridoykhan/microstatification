from django.test import TestCase, SimpleTestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import Form, Language, Project
from .views import (
    _extract_question_labels,
    _build_select_field_option_maps,
    _convert_select_value_to_label,
    _resolve_choice_label,
)
import json

class UpdateTranslationsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(name="Test Project", description="Test Description")
        self.default_language = Language.objects.create(description="English", subtag="en")
        self.other_language = Language.objects.create(description="Spanish", subtag="es")
        self.form = Form.objects.create(
            project=self.project,
            name="Test Form",
            questions=[
                {
                    "type": "text",
                    "name": "question1",
                    "label": "Question 1",
                    "subQuestions": [
                        {
                            "type": "text",
                            "name": "subquestion1",
                            "label": "Sub Question 1"
                        }
                    ]
                }
            ],
            default_language=self.default_language
        )
        self.form.other_languages.add(self.other_language)

    def test_update_translations(self):
        url = reverse('update_translations', args=[self.form.id])
        data = {
            "translations": {
                "Question 1": "Pregunta 1",
                "Sub Question 1": "Sub Pregunta 1"
            },
            "language_subtag": "es"
        }
        response = self.client.put(url, data=json.dumps(data), content_type='application/json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.form.refresh_from_db()
        self.assertEqual(self.form.questions[0]['translations']['Spanish (es)'], "Pregunta 1")
        self.assertEqual(self.form.questions[0]['subQuestions'][0]['translations']['Spanish (es)'], "Sub Pregunta 1")

class EnglishLabelResolutionTests(SimpleTestCase):
    def test_resolve_choice_label_prefers_english_variant_keys(self):
        value = {
            "Bangla (bn)": "বিভাগ",
            "English (en)": "Division",
        }
        self.assertEqual(_resolve_choice_label(value, ""), "Division")

    def test_extract_question_labels_uses_english_translation_when_base_is_bangla(self):
        questions = [
            {
                "type": "text",
                "name": "division",
                "label": "বিভাগ",
                "translations": {
                    "English (en)": "Division",
                    "Bangla (bn)": "বিভাগ",
                },
            }
        ]

        labels = _extract_question_labels(questions)
        self.assertEqual(labels.get("division"), "Division")

    def test_select_option_maps_convert_bangla_values_to_english_labels(self):
        questions = [
            {
                "type": "select_one org",
                "name": "organization",
                "label": "প্রতিষ্ঠান",
                "translations": {
                    "English (en)": "Organization",
                    "Bangla (bn)": "প্রতিষ্ঠান",
                },
                "options": [
                    {
                        "name": "govt",
                        "label": "সরকারি",
                        "translations": {
                            "English (en)": "Govt",
                            "Bangla (bn)": "সরকারি",
                        },
                    },
                    {
                        "name": "brac",
                        "label": "BRAC",
                        "translations": {
                            "Bangla (bn)": "ব্র্যাক",
                        },
                    },
                ],
            }
        ]

        select_maps = _build_select_field_option_maps(questions)
        meta = select_maps["organization"]

        self.assertEqual(meta["options"].get("govt"), "Govt")

        converted_single = _convert_select_value_to_label(
            "সরকারি",
            meta["type"],
            meta["options"],
            meta.get("aliases"),
        )
        self.assertEqual(converted_single, "Govt")

        converted_multiple = _convert_select_value_to_label(
            "সরকারি brac",
            "select_multiple org",
            meta["options"],
            meta.get("aliases"),
        )
        self.assertEqual(converted_multiple, "Govt, BRAC")


if __name__ == "__main__":
    TestCase.main()
