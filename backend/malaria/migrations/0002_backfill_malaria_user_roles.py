from django.db import migrations


LEGACY_SK_ROLES = {2, 3, 4, 5, 6}


def backfill_malaria_roles(apps, schema_editor):
    User = apps.get_model("auth", "User")
    MalariaUserRole = apps.get_model("malaria", "MalariaUserRole")

    for user in User.objects.filter(is_active=True).iterator():
        role = None
        if user.is_superuser or getattr(user, "role", None) == 1:
            role = "admin"
        elif getattr(user, "role", None) in LEGACY_SK_ROLES:
            role = "sk"

        if role:
            MalariaUserRole.objects.update_or_create(user_id=user.id, defaults={"role": role})


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ("malaria", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_malaria_roles, noop_reverse),
    ]
