from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("malaria", "0015_malaria_roles_dm_spo"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="monthaccesssetting",
            name="malaria_unique_month_access_per_year_month",
        ),
        migrations.AddField(
            model_name="monthaccesssetting",
            name="district",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="month_access_settings",
                to="malaria.district",
            ),
        ),
        migrations.AddConstraint(
            model_name="monthaccesssetting",
            constraint=models.UniqueConstraint(
                fields=("reporting_year", "month", "district"),
                name="malaria_unique_month_access_per_year_month_district",
            ),
        ),
        migrations.AlterModelOptions(
            name="monthaccesssetting",
            options={"ordering": ("reporting_year", "district__name", "month")},
        ),
    ]
