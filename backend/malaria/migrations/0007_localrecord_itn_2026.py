from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("malaria", "0006_village_bordering_country_name_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="localrecord",
            name="itn_2026",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
