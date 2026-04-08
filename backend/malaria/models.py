from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


def current_year():
    return timezone.now().year


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class MalariaUserRole(TimestampedModel):
    ROLE_ADMIN = "admin"
    ROLE_SK = "sk"
    ROLE_CHOICES = (
        (ROLE_ADMIN, "Admin"),
        (ROLE_SK, "SK"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="malaria_role")
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)

    class Meta:
        ordering = ("user__username",)

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class District(TimestampedModel):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class Upazila(TimestampedModel):
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="upazilas")
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(fields=("district", "name"), name="malaria_unique_upazila_per_district"),
        ]

    def __str__(self):
        return f"{self.name} ({self.district.name})"


class Union(TimestampedModel):
    upazila = models.ForeignKey(Upazila, on_delete=models.CASCADE, related_name="unions")
    name = models.CharField(max_length=255)

    class Meta:
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(fields=("upazila", "name"), name="malaria_unique_union_per_upazila"),
        ]

    def __str__(self):
        return f"{self.name} ({self.upazila.name})"


class Village(TimestampedModel):
    union = models.ForeignKey(Union, on_delete=models.CASCADE, related_name="villages")
    name = models.CharField(max_length=255)
    name_bn = models.CharField(max_length=255, blank=True, default="")
    village_code = models.CharField(max_length=64, blank=True, default="")
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    population = models.PositiveIntegerField(null=True, blank=True)
    ward_no = models.CharField(max_length=50, blank=True, null=True)
    sk_shw_name = models.CharField(max_length=255, blank=True, default="")
    ss_name = models.CharField(max_length=255, blank=True, default="")
    mmw_hp_chwc_name = models.CharField(max_length=255, blank=True, default="")
    distance_from_upazila_office_km = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    bordering_country_name = models.CharField(max_length=255, blank=True, default="")
    other_activities = models.TextField(blank=True, default="")

    class Meta:
        ordering = ("name",)
        constraints = [
            models.UniqueConstraint(
                fields=("union", "name", "ward_no"),
                name="malaria_unique_village_per_union_and_ward",
            ),
        ]

    def __str__(self):
        suffix = f" (Ward {self.ward_no})" if self.ward_no else ""
        return f"{self.name}{suffix}"


class MonthlyCasesMixin(models.Model):
    jan_cases = models.PositiveIntegerField(default=0)
    feb_cases = models.PositiveIntegerField(default=0)
    mar_cases = models.PositiveIntegerField(default=0)
    apr_cases = models.PositiveIntegerField(default=0)
    may_cases = models.PositiveIntegerField(default=0)
    jun_cases = models.PositiveIntegerField(default=0)
    jul_cases = models.PositiveIntegerField(default=0)
    aug_cases = models.PositiveIntegerField(default=0)
    sep_cases = models.PositiveIntegerField(default=0)
    oct_cases = models.PositiveIntegerField(default=0)
    nov_cases = models.PositiveIntegerField(default=0)
    dec_cases = models.PositiveIntegerField(default=0)

    class Meta:
        abstract = True


class LocalRecord(TimestampedModel, MonthlyCasesMixin):
    village = models.ForeignKey(Village, on_delete=models.CASCADE, related_name="local_records")
    sk_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="malaria_local_records")
    reporting_year = models.PositiveIntegerField(default=current_year)
    hh = models.PositiveIntegerField(default=0)
    population = models.PositiveIntegerField(default=0)
    itn_2023 = models.PositiveIntegerField(default=0)
    itn_2024 = models.PositiveIntegerField(default=0)
    itn_2025 = models.PositiveIntegerField(default=0)
    itn_2026 = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("-reporting_year", "village__name")
        constraints = [
            models.UniqueConstraint(fields=("village", "reporting_year"), name="malaria_unique_local_record_per_village_year"),
        ]

    def __str__(self):
        return f"{self.village} - {self.reporting_year}"


class NonLocalRecord(TimestampedModel, MonthlyCasesMixin):
    sk_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="malaria_non_local_records")
    reporting_year = models.PositiveIntegerField(default=current_year)
    country = models.CharField(max_length=255, default="Bangladesh")
    district_or_state = models.CharField(max_length=255, blank=True, default="")
    upazila_or_township = models.CharField(max_length=255, blank=True, default="")
    union_name = models.CharField(max_length=255, blank=True, default="")
    village_name = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ("-reporting_year", "-updated_at")

    def __str__(self):
        return f"{self.country} - {self.village_name or self.district_or_state} - {self.reporting_year}"


class MonthAccessSetting(TimestampedModel):
    reporting_year = models.PositiveIntegerField(default=current_year)
    month = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    is_open = models.BooleanField(default=False)
    close_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ("reporting_year", "month")
        constraints = [
            models.UniqueConstraint(
                fields=("reporting_year", "month"),
                name="malaria_unique_month_access_per_year_month",
            ),
        ]

    def __str__(self):
        return f"{self.reporting_year} month={self.month} close={self.close_date or 'default'}"


class MonthlyApproval(TimestampedModel):
    RECORD_TYPE_LOCAL = "local"
    RECORD_TYPE_NON_LOCAL = "non_local"
    RECORD_TYPE_CHOICES = (
        (RECORD_TYPE_LOCAL, "Local"),
        (RECORD_TYPE_NON_LOCAL, "Non-Local"),
    )

    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"
    STATUS_CHOICES = (
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    )

    local_record = models.ForeignKey(
        LocalRecord,
        on_delete=models.CASCADE,
        related_name="monthly_approvals",
        null=True,
        blank=True,
    )
    non_local_record = models.ForeignKey(
        NonLocalRecord,
        on_delete=models.CASCADE,
        related_name="monthly_approvals",
        null=True,
        blank=True,
    )
    reporting_year = models.PositiveIntegerField(default=current_year)
    month = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="malaria_monthly_approvals",
        null=True,
        blank=True,
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("reporting_year", "month")
        constraints = [
            models.CheckConstraint(
                check=(
                    (Q(local_record__isnull=False) & Q(non_local_record__isnull=True))
                    | (Q(local_record__isnull=True) & Q(non_local_record__isnull=False))
                ),
                name="malaria_monthly_approval_exactly_one_record",
            ),
            models.UniqueConstraint(
                fields=("local_record", "reporting_year", "month"),
                condition=Q(local_record__isnull=False),
                name="malaria_unique_local_monthly_approval",
            ),
            models.UniqueConstraint(
                fields=("non_local_record", "reporting_year", "month"),
                condition=Q(non_local_record__isnull=False),
                name="malaria_unique_non_local_monthly_approval",
            ),
        ]

    @property
    def record_type(self):
        return self.RECORD_TYPE_LOCAL if self.local_record_id else self.RECORD_TYPE_NON_LOCAL

    @property
    def record_pk(self):
        return self.local_record_id or self.non_local_record_id

    def clean(self):
        super().clean()
        if bool(self.local_record_id) == bool(self.non_local_record_id):
            raise ValidationError("Exactly one of local_record or non_local_record must be set.")

    def __str__(self):
        return f"{self.record_type}:{self.record_pk} month={self.month} status={self.status}"


class MicrostatificationDataUpload(TimestampedModel):
    """Track microstatification Excel file uploads and their parsed data"""
    DISTRICT_CHOICES = [
        ('Bandarban', 'Bandarban'),
        ('Khagrachhari', 'Khagrachhari'),
        ('Cox\'s Bazar', 'Cox\'s Bazar'),
        ('Rangamati', 'Rangamati'),
        ('Chattogram', 'Chattogram'),
    ]
    
    district = models.CharField(max_length=255, choices=DISTRICT_CHOICES)
    excel_file = models.FileField(upload_to='microstatification_uploads/%Y/%m/%d/')
    parsed_data = models.JSONField(default=dict, help_text='Parsed Excel data structure with villages/unions/upazilas')
    districts_created = models.IntegerField(default=0)
    upazilas_created = models.IntegerField(default=0)
    unions_created = models.IntegerField(default=0)
    villages_created = models.IntegerField(default=0)
    villages_updated = models.IntegerField(default=0)
    upload_note = models.TextField(blank=True, default='', help_text='Any notes or errors during upload')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='microstatification_uploads', null=True, blank=True)
    
    class Meta:
        ordering = ('-created_at',)
    
    def __str__(self):
        return f"{self.district} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
