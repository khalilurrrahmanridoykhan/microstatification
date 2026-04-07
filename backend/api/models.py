from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import JSONField
from django.db.models import Q
from django.db.models.signals import post_save
from django.dispatch import receiver


# ...existing code...

# Move Template model definition below Project model


# Adding role field to User model
User.add_to_class('role', models.IntegerField(
    choices=[
        (1, 'admin'),
        (2, 'organization'),
        (3, 'project'),
        (4, 'user'),
        (5, 'datacollector'),
        (6, 'officer'),
        (7, 'micro_admin'),
        (8, 'sk'),
        (9, 'shw'),
    ],
    default=4  # Add this line
))

# Adding created_by field to User model to track who created the user
User.add_to_class('created_by', models.ForeignKey(
    'self',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='users_created'
))

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

class Organization(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    active_user = models.BooleanField(default=False)
    receive_updates = models.BooleanField(default=False)
    created_by = models.ForeignKey('auth.User', related_name='organizations_created', on_delete=models.SET_NULL, null=True, blank=True)
    updated_by = models.ForeignKey('auth.User', related_name='organizations_updated', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name

class Project(models.Model):

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    active_user = models.BooleanField(default=False)
    receive_updates = models.BooleanField(default=False)
    species = models.JSONField(default=list, blank=True)
    organization = models.ForeignKey(
        Organization, related_name='projects', on_delete=models.CASCADE, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, related_name='projects', on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Template(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='templates')
    data_collection_form = models.ForeignKey('Form', on_delete=models.SET_NULL, null=True, blank=True, related_name='template_data_collection')
    lookup_forms = models.ManyToManyField('Form', blank=True, related_name='template_lookup_forms')
    created_at = models.DateTimeField(auto_now_add=True)
    generated_lookup_forms = models.ManyToManyField('Form', blank=True, related_name='template_generated_lookup_forms', help_text='All lookup forms generated from this template after submission')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Form(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='forms')  # Set related_name to 'forms'
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)  # Add this line
    questions = models.JSONField(default=list)  # Use django.db.models.JSONField
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    default_language = models.ForeignKey('Language', null=True, blank=True, on_delete=models.SET_NULL, related_name='default_forms')
    other_languages = models.ManyToManyField('Language', blank=True, related_name='other_forms')
    translations = models.JSONField(default=dict, blank=True)
    submission = models.JSONField(default=list, blank=True)  # <-- Add this line
    enketo_id = models.CharField(max_length=255, blank=True, null=True)  # Add this line
    allow_anonymous_submissions = models.BooleanField(default=False)
    template = models.ForeignKey('Template', null=True, blank=True, on_delete=models.SET_NULL, related_name='forms')
    criteria = models.JSONField(null=True, blank=True, help_text="Stores user-selected mandatory question and expected value(s) for lookup forms")
    form_style = models.CharField(max_length=100, default='default', blank=True, help_text="Form display style for Enketo (e.g., 'theme-grid', 'pages', etc.)")

    def __str__(self):
        return self.name

class Submission(models.Model):
    SOURCE_CHOICES = (
        ('openrosa', 'OpenRosa'),
        ('api', 'API'),
    )
    PROCESSING_STATUS_CHOICES = (
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    form = models.ForeignKey('Form', on_delete=models.CASCADE, null=True, blank=True, related_name='submission_rows')
    instance_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    data = models.JSONField(default=dict, blank=True)
    xml_file = models.FileField(upload_to='submissions/xml/', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='api')
    processing_status = models.CharField(max_length=20, choices=PROCESSING_STATUS_CHOICES, default='queued')
    processing_error = models.TextField(blank=True, default='')
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['form', 'instance_id'],
                condition=Q(form__isnull=False) & Q(instance_id__isnull=False) & ~Q(instance_id=''),
                name='uniq_submission_form_instance',
            ),
        ]
        indexes = [
            models.Index(fields=['form', '-created_at']),
            models.Index(fields=['form', 'is_deleted', '-created_at']),
            models.Index(fields=['processing_status', 'created_at']),
            models.Index(fields=['instance_id', 'created_at']),
        ]

    def __str__(self):
        form_part = f"form={self.form_id}" if self.form_id else "form=legacy"
        instance_part = self.instance_id or "no-instance"
        return f"Submission {self.id} ({form_part}, {instance_part})"

class FormAccess(models.Model):
    project = models.ForeignKey(Project, related_name='form_access', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    access_level = models.CharField(max_length=50)

class Setting(models.Model):
    project = models.ForeignKey(Project, related_name='project_settings', on_delete=models.CASCADE)
    key = models.CharField(max_length=100)
    value = models.CharField(max_length=100)

class Language(models.Model):
    subtag = models.CharField(max_length=10, unique=True)
    type = models.CharField(max_length=50)
    description = models.TextField()
    added = models.DateField()
    deprecated = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.subtag

class UserProfile(models.Model):
    DATA_COLLECTION_TYPE_CHOICES = (
        ('normal', 'Normal'),
        ('microstatification', 'Microstatification'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    organizations = models.ManyToManyField(Organization, blank=True, related_name='user_profiles')
    projects = models.ManyToManyField(Project, blank=True, related_name='user_profiles')
    forms = models.ManyToManyField(Form, blank=True, related_name='user_profiles')
    templates = models.ManyToManyField(Template, blank=True, related_name='user_profiles', help_text='Templates assigned to this user through form submissions')
    data_collection_type = models.CharField(max_length=32, choices=DATA_COLLECTION_TYPE_CHOICES, default='normal')
    micro_role = models.CharField(max_length=32, blank=True, default='')
    micro_division = models.CharField(max_length=255, blank=True, default='')
    micro_district = models.ForeignKey('malaria.District', null=True, blank=True, on_delete=models.SET_NULL, related_name='user_profiles_district')
    micro_upazila = models.ForeignKey('malaria.Upazila', null=True, blank=True, on_delete=models.SET_NULL, related_name='user_profiles_upazila')
    micro_union = models.ForeignKey('malaria.Union', null=True, blank=True, on_delete=models.SET_NULL, related_name='user_profiles_union')
    micro_village = models.ForeignKey('malaria.Village', null=True, blank=True, on_delete=models.SET_NULL, related_name='user_profiles_village')
    micro_villages = models.ManyToManyField('malaria.Village', blank=True, related_name='user_profiles_villages')
    micro_ward_no = models.CharField(max_length=50, blank=True, default='')
    micro_sk_shw_name = models.CharField(max_length=255, blank=True, default='')
    micro_designation = models.CharField(max_length=255, blank=True, default='')
    micro_ss_name = models.CharField(max_length=255, blank=True, default='')

    def __str__(self):
        return self.user.username

class DownloadLog(models.Model):
    TYPE_CHOICES = (
        ('XLS', 'XLS'),
        ('CSV', 'CSV'),
        # Add more types if needed
    )
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    form = models.ForeignKey('Form', on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    file_path = models.CharField(max_length=255)
    created = models.DateTimeField(auto_now_add=True)


# Add soft delete fields to existing models
# We'll use a mixin approach for consistent soft delete functionality
class SoftDeleteMixin(models.Model):
    """
    Mixin to add soft delete functionality to models
    """
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='%(class)s_deleted_items')

    class Meta:
        abstract = True

    def soft_delete(self, user=None):
        """Soft delete the instance"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save()

    def restore(self, user=None):
        """Restore the soft deleted instance"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save()


class Patient(SoftDeleteMixin):
    patient_id = models.CharField(max_length=100, unique=True, help_text='Patient identification from user_identification_11_9943_01976848561')
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    submission_data = models.JSONField(default=dict, blank=True, help_text='Latest submission data for this patient')
    submissions = models.ManyToManyField('Submission', blank=True, related_name='patient_records')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.patient_id} - {self.name or 'Unknown'}"

    class Meta:
        ordering = ['-created_at']


class TrashBin(models.Model):
    """
    Model to store deleted items for 30 days before permanent deletion
    """
    ITEM_TYPES = [
        ('project', 'Project'),
        ('form', 'Form'),
        ('submission', 'Submission'),
        ('patient', 'Patient'),
        ('organization', 'Organization'),
        ('template', 'Template'),
    ]

    item_type = models.CharField(max_length=20, choices=ITEM_TYPES)
    item_id = models.IntegerField()  # Original ID of the deleted item
    item_data = models.JSONField()  # Serialized data of the deleted item
    item_name = models.CharField(max_length=255, help_text="Display name for the item")
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    deleted_at = models.DateTimeField(auto_now_add=True)
    auto_delete_at = models.DateTimeField(help_text="Automatic deletion date (30 days from deletion)")
    restored = models.BooleanField(default=False)
    restored_at = models.DateTimeField(null=True, blank=True)
    restored_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='restored_items')

    class Meta:
        ordering = ['-deleted_at']
        indexes = [
            models.Index(fields=['item_type', 'deleted_at']),
            models.Index(fields=['auto_delete_at']),
            models.Index(fields=['restored']),
        ]

    def __str__(self):
        return f"{self.get_item_type_display()}: {self.item_name} (deleted {self.deleted_at.strftime('%Y-%m-%d')})"

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.auto_delete_at

    def days_until_permanent_deletion(self):
        from django.utils import timezone
        if self.auto_delete_at:
            delta = self.auto_delete_at - timezone.now()
            return max(0, delta.days)
        return 0


class AppVersion(models.Model):
    version = models.CharField(max_length=100)
    update_info = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return self.version
