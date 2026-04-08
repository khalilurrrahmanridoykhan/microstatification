from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    District,
    LocalRecord,
    MalariaUserRole,
    MicrostatificationDataUpload,
    MonthAccessSetting,
    MonthlyApproval,
    NonLocalRecord,
    Union,
    Upazila,
    Village,
)


MONTH_COLUMNS = [
    "jan_cases",
    "feb_cases",
    "mar_cases",
    "apr_cases",
    "may_cases",
    "jun_cases",
    "jul_cases",
    "aug_cases",
    "sep_cases",
    "oct_cases",
    "nov_cases",
    "dec_cases",
]


class RequestedFieldsMixin:
    def __init__(self, *args, **kwargs):
        requested_fields = kwargs.pop("fields", None)
        super().__init__(*args, **kwargs)

        if not requested_fields:
            return

        allowed_fields = set(requested_fields)
        existing_fields = set(self.fields)
        for field_name in existing_fields - allowed_fields:
            self.fields.pop(field_name)


def build_full_name(user):
    full_name = " ".join(part for part in [user.first_name, user.last_name] if part).strip()
    return full_name or user.email or user.username


def _clean_assignment_text(value):
    return str(value or "").strip()


def _get_assigned_micro_role(user, profile):
    micro_role = _clean_assignment_text(getattr(profile, "micro_role", "")).lower()
    if micro_role in {"sk", "shw"}:
        return micro_role

    user_role = getattr(user, "role", None)
    if user_role == 8:
        return "sk"
    if user_role == 9:
        return "shw"
    return ""


def get_local_record_assigned_user_details(record):
    user = getattr(record, "sk_user", None)
    profile = getattr(user, "profile", None) if user else None
    if not user:
        return {"name": "", "designation": "", "ss_name": ""}

    micro_role = _get_assigned_micro_role(user, profile)
    assigned_name = _clean_assignment_text(getattr(profile, "micro_sk_shw_name", ""))
    assigned_designation = _clean_assignment_text(getattr(profile, "micro_designation", ""))
    assigned_ss_name = _clean_assignment_text(getattr(profile, "micro_ss_name", ""))

    has_assignment = bool(
        micro_role in {"sk", "shw"}
        or assigned_name
        or assigned_designation
        or assigned_ss_name
    )
    if not has_assignment:
        return {"name": "", "designation": "", "ss_name": ""}

    return {
        "name": assigned_name or build_full_name(user),
        "designation": assigned_designation or (micro_role.upper() if micro_role else ""),
        "ss_name": assigned_ss_name,
    }


def get_cached_local_record_assigned_user_details(record):
    cached = getattr(record, "_cached_local_record_assigned_user_details", None)
    if cached is None:
        cached = get_local_record_assigned_user_details(record)
        setattr(record, "_cached_local_record_assigned_user_details", cached)
    return cached


def get_local_record_display_details(record, village=None, designation_lookup=None):
    assigned = get_local_record_assigned_user_details(record)
    fallback_name = _clean_assignment_text(getattr(village, "sk_shw_name", ""))
    fallback_ss_name = _clean_assignment_text(getattr(village, "ss_name", ""))

    display_name = assigned["name"] or fallback_name
    display_designation = assigned["designation"]
    if not display_designation and designation_lookup and display_name:
        lookup_key = " ".join(display_name.split()).lower()
        display_designation = designation_lookup.get(lookup_key, "") or ""

    return {
        "name": display_name,
        "designation": display_designation,
        "ss_name": assigned["ss_name"] or fallback_ss_name,
    }


class ProfileSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    full_name = serializers.CharField()
    email = serializers.CharField()
    micro_role = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class MalariaUserRoleSerializer(RequestedFieldsMixin, serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = MalariaUserRole
        fields = ("user_id", "role", "created_at", "updated_at")


class DistrictSerializer(RequestedFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ("id", "name", "created_at", "updated_at")


class UpazilaSerializer(RequestedFieldsMixin, serializers.ModelSerializer):
    district_id = serializers.IntegerField(read_only=True)
    district = serializers.PrimaryKeyRelatedField(
        queryset=District.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Upazila
        fields = ("id", "name", "district_id", "district", "created_at", "updated_at")


class UnionSerializer(RequestedFieldsMixin, serializers.ModelSerializer):
    upazila_id = serializers.IntegerField(read_only=True)
    upazila = serializers.PrimaryKeyRelatedField(
        queryset=Upazila.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Union
        fields = ("id", "name", "upazila_id", "upazila", "created_at", "updated_at")


class VillageSerializer(RequestedFieldsMixin, serializers.ModelSerializer):
    union_id = serializers.IntegerField(read_only=True)
    union = serializers.PrimaryKeyRelatedField(
        queryset=Union.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Village
        fields = (
            "id",
            "name",
            "name_bn",
            "village_code",
            "latitude",
            "longitude",
            "population",
            "ward_no",
            "sk_shw_name",
            "ss_name",
            "mmw_hp_chwc_name",
            "distance_from_upazila_office_km",
            "bordering_country_name",
            "other_activities",
            "union_id",
            "union",
            "created_at",
            "updated_at",
        )


class DistrictNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ("name",)


class UpazilaNestedSerializer(serializers.ModelSerializer):
    districts = DistrictNestedSerializer(source="district", read_only=True)

    class Meta:
        model = Upazila
        fields = ("name", "districts")


class UnionNestedSerializer(serializers.ModelSerializer):
    upazilas = UpazilaNestedSerializer(source="upazila", read_only=True)

    class Meta:
        model = Union
        fields = ("name", "upazilas")


class VillageNestedSerializer(serializers.ModelSerializer):
    unions = UnionNestedSerializer(source="union", read_only=True)

    class Meta:
        model = Village
        fields = (
            "name",
            "name_bn",
            "village_code",
            "latitude",
            "longitude",
            "population",
            "ward_no",
            "sk_shw_name",
            "ss_name",
            "mmw_hp_chwc_name",
            "distance_from_upazila_office_km",
            "bordering_country_name",
            "other_activities",
            "unions",
        )


class LocalRecordSerializer(RequestedFieldsMixin, serializers.ModelSerializer):
    village_id = serializers.IntegerField(read_only=True)
    sk_user_id = serializers.IntegerField(read_only=True)
    sk_user_username = serializers.CharField(source="sk_user.username", read_only=True)
    sk_user_display_name = serializers.SerializerMethodField()
    sk_user_designation = serializers.SerializerMethodField()
    sk_user_ss_name = serializers.SerializerMethodField()
    district_name = serializers.ReadOnlyField(source="village.union.upazila.district.name")
    upazila_name = serializers.ReadOnlyField(source="village.union.upazila.name")
    union_name = serializers.ReadOnlyField(source="village.union.name")
    ward_no = serializers.ReadOnlyField(source="village.ward_no")
    village_name = serializers.ReadOnlyField(source="village.name")
    village_name_bn = serializers.ReadOnlyField(source="village.name_bn")
    village_code = serializers.ReadOnlyField(source="village.village_code")
    village_latitude = serializers.ReadOnlyField(source="village.latitude")
    village_longitude = serializers.ReadOnlyField(source="village.longitude")
    village_population = serializers.ReadOnlyField(source="village.population")
    village_sk_shw_name = serializers.SerializerMethodField()
    raw_village_sk_shw_name = serializers.ReadOnlyField(source="village.sk_shw_name")
    village_ss_name = serializers.SerializerMethodField()
    raw_village_ss_name = serializers.ReadOnlyField(source="village.ss_name")
    village_mmw_hp_chwc_name = serializers.ReadOnlyField(source="village.mmw_hp_chwc_name")
    village_distance_from_upazila_office_km = serializers.ReadOnlyField(
        source="village.distance_from_upazila_office_km"
    )
    village_bordering_country_name = serializers.ReadOnlyField(source="village.bordering_country_name")
    village_other_activities = serializers.ReadOnlyField(source="village.other_activities")
    village = serializers.PrimaryKeyRelatedField(queryset=Village.objects.all(), write_only=True, required=False)
    sk_user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, required=False)
    villages = VillageNestedSerializer(source="village", read_only=True)

    def get_sk_user_display_name(self, obj):
        return get_cached_local_record_assigned_user_details(obj)["name"]

    def get_sk_user_designation(self, obj):
        return get_cached_local_record_assigned_user_details(obj)["designation"]

    def get_sk_user_ss_name(self, obj):
        return get_cached_local_record_assigned_user_details(obj)["ss_name"]

    def get_village_sk_shw_name(self, obj):
        return self.get_sk_user_display_name(obj) or _clean_assignment_text(getattr(obj.village, "sk_shw_name", ""))

    def get_village_ss_name(self, obj):
        return self.get_sk_user_ss_name(obj) or _clean_assignment_text(getattr(obj.village, "ss_name", ""))

    class Meta:
        model = LocalRecord
        fields = (
            "id",
            "village_id",
            "sk_user_id",
            "sk_user_username",
            "sk_user_display_name",
            "sk_user_designation",
            "sk_user_ss_name",
            "district_name",
            "upazila_name",
            "union_name",
            "ward_no",
            "village_name",
            "village_name_bn",
            "village_code",
            "village_latitude",
            "village_longitude",
            "village_population",
            "village_sk_shw_name",
            "raw_village_sk_shw_name",
            "village_ss_name",
            "raw_village_ss_name",
            "village_mmw_hp_chwc_name",
            "village_distance_from_upazila_office_km",
            "village_bordering_country_name",
            "village_other_activities",
            "reporting_year",
            "hh",
            "population",
            "itn_2023",
            "itn_2024",
            "itn_2025",
            "itn_2026",
            *MONTH_COLUMNS,
            "created_at",
            "updated_at",
            "villages",
            "village",
            "sk_user",
        )


class NonLocalRecordSerializer(RequestedFieldsMixin, serializers.ModelSerializer):
    sk_user_id = serializers.IntegerField(read_only=True)
    sk_user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, required=False)

    class Meta:
        model = NonLocalRecord
        fields = (
            "id",
            "sk_user_id",
            "reporting_year",
            "country",
            "district_or_state",
            "upazila_or_township",
            "union_name",
            "village_name",
            *MONTH_COLUMNS,
            "created_at",
            "updated_at",
            "sk_user",
        )


class MonthAccessSettingSerializer(RequestedFieldsMixin, serializers.ModelSerializer):
    class Meta:
        model = MonthAccessSetting
        fields = (
            "id",
            "reporting_year",
            "month",
            "is_open",
            "close_date",
            "created_at",
            "updated_at",
        )


class MonthlyApprovalSerializer(RequestedFieldsMixin, serializers.ModelSerializer):
    record_type = serializers.SerializerMethodField()
    record_id = serializers.SerializerMethodField()
    local_record_id = serializers.IntegerField(read_only=True)
    non_local_record_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = MonthlyApproval
        fields = (
            "id",
            "record_type",
            "record_id",
            "local_record_id",
            "non_local_record_id",
            "reporting_year",
            "month",
            "status",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        )

    def get_record_type(self, obj):
        return obj.record_type

    def get_record_id(self, obj):
        return obj.record_pk


class MalariaSessionSerializer(serializers.Serializer):
    user = serializers.DictField()
    profile = ProfileSerializer(allow_null=True)
    role = serializers.CharField(allow_null=True)


class MalariaUserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.CharField()
    role = serializers.ChoiceField(choices=MalariaUserRole.ROLE_CHOICES, default=MalariaUserRole.ROLE_SK)


class MicrostatificationDataUploadSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = MicrostatificationDataUpload
        fields = (
            'id',
            'district',
            'excel_file',
            'parsed_data',
            'districts_created',
            'upazilas_created',
            'unions_created',
            'villages_created',
            'villages_updated',
            'upload_note',
            'uploaded_by',
            'uploaded_by_username',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'parsed_data',
            'districts_created',
            'upazilas_created',
            'unions_created',
            'villages_created',
            'villages_updated',
            'upload_note',
            'created_at',
            'updated_at',
        )


class MicrostatificationDataUploadFileSerializer(serializers.Serializer):
    excel_file = serializers.FileField()
    district = serializers.CharField(max_length=255)
