# Generated manually for MalariaGridColumnLayout

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("malaria", "0012_localrecord_malaria_local_year_idx_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="MalariaGridColumnLayout",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "grid_key",
                    models.CharField(
                        choices=[
                            ("local_records", "Local records grid"),
                            ("non_local_records", "Non-local records grid"),
                        ],
                        max_length=32,
                        unique=True,
                    ),
                ),
                (
                    "column_widths",
                    models.JSONField(
                        default=dict,
                        help_text='Map of column index (string "0".."36") to width in px',
                    ),
                ),
                ("is_expanded_to_header_width", models.BooleanField(default=False)),
            ],
            options={
                "ordering": ("grid_key",),
            },
        ),
    ]
