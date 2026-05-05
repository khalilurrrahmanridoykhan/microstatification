from django.db import migrations, models


def forwards_role_sk_to_spo(apps, schema_editor):
    MalariaUserRole = apps.get_model("malaria", "MalariaUserRole")
    MalariaUserRole.objects.filter(role="sk").update(role="spo")


def noop_reverse(apps, schema_editor):
    MalariaUserRole = apps.get_model("malaria", "MalariaUserRole")
    MalariaUserRole.objects.filter(role="spo").update(role="sk")


class Migration(migrations.Migration):

    dependencies = [
        ("malaria", "0014_metadata_approval_fields"),
    ]

    operations = [
        migrations.RunPython(forwards_role_sk_to_spo, noop_reverse),
        migrations.AlterField(
            model_name="malariauserrole",
            name="role",
            field=models.CharField(
                choices=[
                    ("admin", "Admin"),
                    ("dm", "District Manager"),
                    ("spo", "SPO"),
                ],
                max_length=16,
            ),
        ),
    ]
