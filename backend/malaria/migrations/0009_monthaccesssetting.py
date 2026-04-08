import malaria.models
import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("malaria", "0008_alter_monthlyapproval_status"),
    ]

    operations = [
        migrations.CreateModel(
            name="MonthAccessSetting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("reporting_year", models.PositiveIntegerField(default=malaria.models.current_year)),
                (
                    "month",
                    models.PositiveSmallIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1),
                            django.core.validators.MaxValueValidator(12),
                        ]
                    ),
                ),
                ("is_open", models.BooleanField(default=False)),
            ],
            options={
                "ordering": ("reporting_year", "month"),
            },
        ),
        migrations.AddConstraint(
            model_name="monthaccesssetting",
            constraint=models.UniqueConstraint(
                fields=("reporting_year", "month"),
                name="malaria_unique_month_access_per_year_month",
            ),
        ),
    ]
