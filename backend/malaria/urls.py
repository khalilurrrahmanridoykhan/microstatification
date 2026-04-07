from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DistrictViewSet,
    MalariaDashboardView,
    LocalRecordViewSet,
    MalariaDashboardSummaryView,
    MalariaLogoutView,
    MalariaMasterDataView,
    MalariaMeView,
    MalariaSessionView,
    MalariaUsersView,
    MalariaUserCreateView,
    MicrostatificationDashboardSummaryView,
    MicrostatificationDataDirectDownloadView,
    MicrostatificationDataDownloadView,
    MicrostatificationDataDownloadLinkView,
    MicrostatificationDataUploadView,
    MonthlyApprovalViewSet,
    NonLocalRecordViewSet,
    ProfilesView,
    UnionViewSet,
    UpazilaViewSet,
    UserRolesView,
    VillageViewSet,
)


router = DefaultRouter()
router.register(r"districts", DistrictViewSet, basename="malaria-district")
router.register(r"upazilas", UpazilaViewSet, basename="malaria-upazila")
router.register(r"unions", UnionViewSet, basename="malaria-union")
router.register(r"villages", VillageViewSet, basename="malaria-village")
router.register(r"local-records", LocalRecordViewSet, basename="malaria-local-record")
router.register(r"non-local-records", NonLocalRecordViewSet, basename="malaria-non-local-record")
router.register(r"monthly-approvals", MonthlyApprovalViewSet, basename="malaria-monthly-approval")
router.register(r"approvals", MonthlyApprovalViewSet, basename="malaria-approval")


urlpatterns = [
    path("", include(router.urls)),
    path("me/", MalariaMeView.as_view(), name="malaria-me"),
    path("dashboard/", MalariaDashboardView.as_view(), name="malaria-dashboard"),
    path("auth/session/", MalariaSessionView.as_view(), name="malaria-session"),
    path("auth/logout/", MalariaLogoutView.as_view(), name="malaria-logout"),
    path("dashboard/summary/", MalariaDashboardSummaryView.as_view(), name="malaria-dashboard-summary"),
    path("microstatification/dashboard/summary/", MicrostatificationDashboardSummaryView.as_view(), name="malaria-microstatification-dashboard-summary"),
    path("users/", MalariaUsersView.as_view(), name="malaria-users"),
    path("profiles/", ProfilesView.as_view(), name="malaria-profiles"),
    path("user-roles/", UserRolesView.as_view(), name="malaria-user-roles"),
    path("users/create/", MalariaUserCreateView.as_view(), name="malaria-user-create"),
    path("master-data/", MalariaMasterDataView.as_view(), name="malaria-master-data"),
    path("microstatification-uploads/", MicrostatificationDataUploadView.as_view(), name="malaria-microstatification-uploads"),
    path("upload/microstatification/", MicrostatificationDataUploadView.as_view(), name="malaria-upload-microstatification"),
    path("download/microstatification/link/", MicrostatificationDataDownloadLinkView.as_view(), name="malaria-download-microstatification-link"),
    path("download/microstatification/file/", MicrostatificationDataDirectDownloadView.as_view(), name="malaria-download-microstatification-file"),
    path("download/microstatification/", MicrostatificationDataDownloadView.as_view(), name="malaria-download-microstatification"),
]
