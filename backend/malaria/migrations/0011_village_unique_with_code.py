from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("malaria", "0010_monthaccesssetting_close_date"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="village",
            name="malaria_unique_village_per_union_and_ward",
        ),
        migrations.AddConstraint(
            model_name="village",
            constraint=models.UniqueConstraint(
                fields=("union", "name", "ward_no", "village_code"),
                name="malaria_unique_village_per_union_ward_and_code",
            ),
        ),
    ]
