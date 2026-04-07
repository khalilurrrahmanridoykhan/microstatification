# from .models import Template

# Serializer for Template model (move below FormSerializer)
from django.contrib.auth.models import User
from django.db import models
from rest_framework import serializers, viewsets, status
from rest_framework.response import Response
from .models import Project, Form, FormAccess, Setting, Submission, Language, Organization, UserProfile, Patient, TrashBin, AppVersion
from malaria.models import District as MalariaDistrict, Upazila as MalariaUpazila, Union as MalariaUnion, Village as MalariaVillage


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = '__all__'

class FormSerializer(serializers.ModelSerializer):
    default_language = serializers.PrimaryKeyRelatedField(
        queryset=Language.objects.all(),
        allow_null=True,
        required=False,
    )
    other_languages = serializers.PrimaryKeyRelatedField(
        queryset=Language.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Form
        fields = '__all__'


class FormWithoutSubmissionSerializer(serializers.ModelSerializer):
    default_language = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )
    other_languages = serializers.PrimaryKeyRelatedField(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Form
        exclude = ('submission',)

class FormListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ('id', 'name', 'created_at', 'updated_at', 'template')


# Serializer for Template model
from .models import Template
class TemplateSerializer(serializers.ModelSerializer):
    data_collection_form = FormSerializer(read_only=True)
    lookup_forms = FormSerializer(many=True, read_only=True)
    generated_lookup_forms = FormSerializer(many=True, read_only=True)

    class Meta:
        model = Template
        fields = '__all__'

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all()
    serializer_class = FormSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Handle default_language
        default_language = request.data.get('default_language')

        if default_language:
            instance.default_language_id = default_language

        instance.save()

        return Response(serializer.data)

class FormAccessSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormAccess
        fields = '__all__'

class SettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Setting
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    forms = FormSerializer(many=True, read_only=True)
    form_access = FormAccessSerializer(many=True, read_only=True)
    project_settings = SettingSerializer(many=True, read_only=True)
    created_by = serializers.ReadOnlyField(source='created_by.username')
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        required=True
    )

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'organization', 'location',
            'active_user', 'receive_updates', 'species',
            'forms', 'form_access', 'project_settings', 'created_by',
            'created_at', 'updated_at'
        ]


class ProjectWithFormListSerializer(serializers.ModelSerializer):
    forms = FormListSerializer(many=True, read_only=True)
    form_access = FormAccessSerializer(many=True, read_only=True)
    project_settings = SettingSerializer(many=True, read_only=True)
    created_by = serializers.ReadOnlyField(source='created_by.username')
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        required=True
    )

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'organization', 'location',
            'active_user', 'receive_updates', 'species',
            'forms', 'form_access', 'project_settings', 'created_by',
            'created_at', 'updated_at'
        ]

class ProjectListSerializer(serializers.ModelSerializer):
    forms_count = serializers.IntegerField(read_only=True)
    templates_count = serializers.IntegerField(read_only=True)
    created_by = serializers.ReadOnlyField(source='created_by.username')
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'organization', 'organization_name',
            'location', 'active_user', 'receive_updates', 'species',
            'forms_count', 'templates_count', 'created_by', 'created_at', 'updated_at'
        ]

class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    # Use values_list to only fetch IDs - dramatically faster for login
    organizations = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()
    templates = serializers.SerializerMethodField()
    micro_district = serializers.SerializerMethodField()
    micro_upazila = serializers.SerializerMethodField()
    micro_union = serializers.SerializerMethodField()
    micro_village = serializers.SerializerMethodField()
    micro_villages = serializers.SerializerMethodField()

    def get_organizations(self, obj):
        return list(obj.organizations.values_list('id', flat=True))
    
    def get_projects(self, obj):
        return list(obj.projects.values_list('id', flat=True))
    
    def get_forms(self, obj):
        return list(obj.forms.values_list('id', flat=True))
    
    def get_templates(self, obj):
        return list(obj.templates.values_list('id', flat=True))

    def get_micro_district(self, obj):
        return obj.micro_district_id

    def get_micro_upazila(self, obj):
        return obj.micro_upazila_id

    def get_micro_union(self, obj):
        return obj.micro_union_id

    def get_micro_village(self, obj):
        return obj.micro_village_id

    def get_micro_villages(self, obj):
        return list(obj.micro_villages.values_list('id', flat=True))

    class Meta:
        model = UserProfile
        fields = [
            'organizations',
            'projects',
            'forms',
            'templates',
            'data_collection_type',
            'micro_role',
            'micro_division',
            'micro_district',
            'micro_upazila',
            'micro_union',
            'micro_village',
            'micro_villages',
            'micro_ward_no',
            'micro_sk_shw_name',
            'micro_designation',
            'micro_ss_name',
        ]

class UserProfileWriteSerializer(serializers.ModelSerializer):
    """Separate serializer for writing profile data during user creation/update"""
    organizations = serializers.PrimaryKeyRelatedField(many=True, queryset=Organization.objects.all(), required=False)
    projects = serializers.PrimaryKeyRelatedField(many=True, queryset=Project.objects.all(), required=False)
    forms = serializers.PrimaryKeyRelatedField(many=True, queryset=Form.objects.all(), required=False)
    templates = serializers.PrimaryKeyRelatedField(many=True, queryset=Template.objects.all(), required=False)
    micro_district = serializers.PrimaryKeyRelatedField(queryset=MalariaDistrict.objects.all(), required=False, allow_null=True)
    micro_upazila = serializers.PrimaryKeyRelatedField(queryset=MalariaUpazila.objects.all(), required=False, allow_null=True)
    micro_union = serializers.PrimaryKeyRelatedField(queryset=MalariaUnion.objects.all(), required=False, allow_null=True)
    micro_village = serializers.PrimaryKeyRelatedField(queryset=MalariaVillage.objects.all(), required=False, allow_null=True)
    micro_villages = serializers.PrimaryKeyRelatedField(queryset=MalariaVillage.objects.all(), many=True, required=False)

    class Meta:
        model = UserProfile
        fields = [
            'organizations',
            'projects',
            'forms',
            'templates',
            'data_collection_type',
            'micro_role',
            'micro_division',
            'micro_district',
            'micro_upazila',
            'micro_union',
            'micro_village',
            'micro_villages',
            'micro_ward_no',
            'micro_sk_shw_name',
            'micro_designation',
            'micro_ss_name',
        ]

class UserListSerializer(serializers.ModelSerializer):
    """List serializer for user tables with profile ids and creator."""
    created_by = serializers.ReadOnlyField(source='created_by.username')
    profile = serializers.SerializerMethodField()

    def get_profile(self, obj):
        try:
            profile = obj.profile
        except Exception:
            return None
        return UserProfileSerializer(profile).data

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'is_staff',
            'date_joined',
            'created_by',
            'profile',
        ]

class UserListViewSerializer(serializers.ModelSerializer):
    """Lightweight list serializer for user list view."""
    created_by = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'created_by',
            'date_joined',
        ]

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    profile = UserProfileWriteSerializer(required=False)  # Use write serializer for create/update

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'is_staff', 'profile', 'date_joined'  # Add date_joined here
        ]

    PROFILE_M2M_FIELDS = ['organizations', 'projects', 'forms', 'templates']
    PROFILE_SCALAR_FIELDS = [
        'data_collection_type',
        'micro_role',
        'micro_division',
        'micro_district',
        'micro_upazila',
        'micro_union',
        'micro_village',
        'micro_ward_no',
        'micro_sk_shw_name',
        'micro_designation',
        'micro_ss_name',
    ]

    def _apply_profile_data(self, profile, profile_data):
        for field in self.PROFILE_M2M_FIELDS:
            if field in profile_data:
                getattr(profile, field).set(profile_data[field])

        for field in self.PROFILE_SCALAR_FIELDS:
            if field in profile_data:
                setattr(profile, field, profile_data[field])

        profile.save()

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        created_by = self.context.get('created_by', None)

        print(f"📋 UserSerializer.create called")
        print(f"📋 Context: {self.context.keys()}")
        print(f"📋 created_by from context: {created_by}")

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.role = validated_data.get('role', 4)
        user.is_staff = validated_data.get('is_staff', False)

        # Set created_by if provided
        if created_by:
            user.created_by = created_by
            print(f"📋 Set user.created_by to: {created_by} (ID: {created_by.id})")
        else:
            print(f"⚠️ No created_by in context!")

        user.save()
        print(f"📋 User saved: {user.username}, created_by_id in DB should be: {user.created_by_id if hasattr(user, 'created_by_id') else 'N/A'}")

        # Handle UserProfile
        self._apply_profile_data(user.profile, profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.role = validated_data.get('role', instance.role)
        instance.is_staff = validated_data.get('is_staff', instance.is_staff)
        password = validated_data.get('password', None)
        if password:
            instance.set_password(password)
        instance.save()
        # Handle UserProfile
        self._apply_profile_data(instance.profile, profile_data)
        return instance

class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password', 'first_name', 'last_name', 'email', 'role')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        role = validated_data.pop('role', None)
        user = User.objects.create_user(**validated_data)
        if role is not None:
            user.role = role
            user.save()
        return user

class OrganizationSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    updated_by = serializers.ReadOnlyField(source='updated_by.username')

    class Meta:
        model = Organization
        fields = '__all__'

class PatientSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    submission_count = serializers.SerializerMethodField()
    created_at = serializers.ReadOnlyField()
    updated_at = serializers.ReadOnlyField()

    class Meta:
        model = Patient
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make patient_id read-only only for updates, not for creation
        if self.instance is not None:
            self.fields['patient_id'].read_only = True

    def get_submission_count(self, obj):
        return obj.submissions.count()

    def validate_age(self, value):
        """
        Custom validation for age field to handle empty strings
        """
        if value == "" or value is None:
            return None

        try:
            age = int(value)
            if age < 0 or age > 150:
                raise serializers.ValidationError("Age must be between 0 and 150.")
            return age
        except (ValueError, TypeError):
            raise serializers.ValidationError("Age must be a valid number.")

    def validate_email(self, value):
        """
        Custom validation for email field to handle empty strings
        """
        if value == "" or value is None:
            return None

        # Let Django's EmailField handle the validation
        return value

    def validate(self, data):
        """
        Custom validation to clean up empty string values
        """
        # Convert empty strings to None for optional fields
        for field in ['email', 'phone', 'gender', 'address']:
            if field in data and data[field] == "":
                data[field] = None

        return data


class _TrashBinBaseSerializer(serializers.ModelSerializer):
    deleted_by_username = serializers.CharField(source='deleted_by.username', read_only=True)
    restored_by_username = serializers.CharField(source='restored_by.username', read_only=True)
    days_until_deletion = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    def get_days_until_deletion(self, obj):
        return obj.days_until_permanent_deletion()

    def get_is_expired(self, obj):
        return obj.is_expired()


class TrashBinListSerializer(_TrashBinBaseSerializer):
    class Meta:
        model = TrashBin
        fields = [
            'id',
            'item_type',
            'item_id',
            'item_name',
            'deleted_by',
            'deleted_by_username',
            'deleted_at',
            'auto_delete_at',
            'restored',
            'restored_at',
            'restored_by',
            'restored_by_username',
            'days_until_deletion',
            'is_expired',
        ]


class TrashBinSerializer(_TrashBinBaseSerializer):
    class Meta:
        model = TrashBin
        fields = '__all__'


class AppVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppVersion
        fields = ['id', 'version', 'update_info', 'created_at']
