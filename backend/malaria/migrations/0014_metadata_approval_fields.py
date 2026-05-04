# Metadata approval (SK/SHW submissions + admin review)

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("malaria", "0013_malaria_grid_column_layout"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="localrecord",
            name="metadata_approval_status",
            field=models.CharField(
                choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")],
                default="APPROVED",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="localrecord",
            name="metadata_pending",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="localrecord",
            name="metadata_reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="localrecord",
            name="metadata_rejection_note",
            field=models.CharField(blank=True, default="", max_length=500),
        ),
        migrations.AddField(
            model_name="localrecord",
            name="metadata_reviewed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="malaria_local_metadata_reviews",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddIndex(
            model_name="localrecord",
            index=models.Index(
                fields=["metadata_approval_status", "reporting_year"],
                name="mal_loc_meta_stat_yr_idx",
            ),
        ),
        migrations.AddField(
            model_name="nonlocalrecord",
            name="grid_metadata",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="nonlocalrecord",
            name="metadata_approval_status",
            field=models.CharField(
                choices=[("PENDING", "Pending"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")],
                default="APPROVED",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="nonlocalrecord",
            name="metadata_pending",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="nonlocalrecord",
            name="metadata_reviewed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="nonlocalrecord",
            name="metadata_rejection_note",
            field=models.CharField(blank=True, default="", max_length=500),
        ),
        migrations.AddField(
            model_name="nonlocalrecord",
            name="metadata_reviewed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="malaria_nonlocal_metadata_reviews",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddIndex(
            model_name="nonlocalrecord",
            index=models.Index(
                fields=["metadata_approval_status", "reporting_year"],
                name="mal_nloc_meta_stat_yr_idx",
            ),
        ),
    ]
