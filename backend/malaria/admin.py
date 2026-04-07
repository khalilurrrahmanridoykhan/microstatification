from django.contrib import admin

from .models import (
    District,
    LocalRecord,
    MalariaUserRole,
    MonthlyApproval,
    NonLocalRecord,
    Union,
    Upazila,
    Village,
)


@admin.register(MalariaUserRole)
class MalariaUserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "created_at", "updated_at")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email", "user__first_name", "user__last_name")


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


@admin.register(Upazila)
class UpazilaAdmin(admin.ModelAdmin):
    list_display = ("name", "district", "created_at")
    list_filter = ("district",)
    search_fields = ("name", "district__name")


@admin.register(Union)
class UnionAdmin(admin.ModelAdmin):
    list_display = ("name", "upazila", "created_at")
    list_filter = ("upazila__district", "upazila")
    search_fields = ("name", "upazila__name", "upazila__district__name")


@admin.register(Village)
class VillageAdmin(admin.ModelAdmin):
    list_display = ("name", "ward_no", "union", "mmw_hp_chwc_name", "created_at")
    list_filter = ("union__upazila__district", "union__upazila", "union")
    search_fields = (
        "name",
        "ward_no",
        "mmw_hp_chwc_name",
        "bordering_country_name",
        "other_activities",
        "union__name",
        "union__upazila__name",
        "union__upazila__district__name",
    )


@admin.register(LocalRecord)
class LocalRecordAdmin(admin.ModelAdmin):
    list_display = ("village", "sk_user", "reporting_year", "updated_at")
    list_filter = ("reporting_year", "village__union__upazila__district")
    search_fields = ("village__name", "sk_user__username", "sk_user__email")


@admin.register(NonLocalRecord)
class NonLocalRecordAdmin(admin.ModelAdmin):
    list_display = ("country", "district_or_state", "village_name", "sk_user", "reporting_year")
    list_filter = ("reporting_year", "country")
    search_fields = ("country", "district_or_state", "upazila_or_township", "village_name", "sk_user__email")


@admin.register(MonthlyApproval)
class MonthlyApprovalAdmin(admin.ModelAdmin):
    list_display = ("record_type", "record_pk", "month", "status", "reporting_year", "approved_by", "approved_at")
    list_filter = ("status", "reporting_year", "month")
    search_fields = ("approved_by__username", "approved_by__email")
