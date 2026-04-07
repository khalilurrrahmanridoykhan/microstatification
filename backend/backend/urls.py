# backend/backend/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import FormViewSet, SubmissionViewSet, ProjectViewSet, LanguageViewSet, CustomAuthToken, RegisterUser, UserViewSet, OrganizationViewSet, PatientViewSet, TrashBinViewSet, DashboardSummaryView
from api.views import get_project_templates, get_project_templates_paginated, get_project_templates_full, lookup_form_set_criteria, get_template_by_id, get_template_followup_forms
from api.views import delete_template, update_template, clone_template, get_all_projects, get_current_user_profile
from django.conf import settings
from django.conf.urls.static import static
from api.views import update_translations, convert_xlsform, openrosa_xform, openrosa_submission, openrosa_form_list, get_submission_xml, download_form_csv, list_form_media, download_form_zip, update_submission_validation, delete_submission, generate_xls_download, list_download_logs, delete_download_log, get_enketo_edit_url, update_form_anonymous_setting, set_enketo_cookie, get_patients_csv, create_enketo_survey, get_latest_app_version
from api.auth_views import enketo_login, logout_enketo
from api.views import debug_auth, debug_enketo_auth, test_cookie, get_csrf_token, submit_form
from django.middleware.csrf import get_token
from api import views


router = DefaultRouter()
router.register(r'forms', FormViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'languages', LanguageViewSet)
router.register(r'users', UserViewSet)
router.register(r'organizations', OrganizationViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'trash', TrashBinViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/malaria/', include('malaria.urls')),
    path('api/auth/login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('api/auth/register/', RegisterUser.as_view(), name='api_register'),
    path('api/csrf-token/', get_csrf_token, name='csrf_token'),  # Add this line
    path('api/mobile/app-version/latest/', get_latest_app_version, name='get_latest_app_version'),
    path('api/get-project-templates/<int:project_id>/', get_project_templates, name='get_project_templates'),
    path('api/get-project-templates-paginated/<int:project_id>/', get_project_templates_paginated, name='get_project_templates_paginated'),
    path('api/get-project-templates-full/<int:project_id>/', views.get_project_templates_full, name='get_project_templates_full'),
    path('api/get-project-templates-full-xlsx/<int:project_id>/', views.download_project_templates_full_xlsx, name='download_project_templates_full_xlsx'),
    path('api/get-all-projects/', get_all_projects, name='get_all_projects'),
    path('api/get-current-user-profile/', get_current_user_profile, name='get_current_user_profile'),
    path('api/dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('api/projects/<int:pk>/create_form/', FormViewSet.as_view({'post': 'create_form'}), name='create_form'),
    # path('api/forms/<int:pk>/submit/', FormViewSet.as_view({'post': 'submit'}), name='form_submit'),  # Removed to avoid CSRF errors, use function-based view only
    path('api/forms/<int:form_id>/translations/', update_translations, name='update_translations'),
    path('api/convert/xlsform/', convert_xlsform, name='convert_xlsform'),
    path('api/get-template/<int:template_id>/', get_template_by_id, name='get_template_by_id'),
    path('api/templates/<int:template_id>/followup-forms/', get_template_followup_forms, name='get_template_followup_forms'),
    # OpenRosa API endpoints
    path('api/openrosa/forms/<int:form_id>/form.xml', openrosa_xform, name='openrosa_xform'),
    path('api/openrosa/submission/', openrosa_submission, name='openrosa_submission'),
    path('api/openrosa/formList', openrosa_form_list, name='openrosa_form_list'),
    path('api/openrosa/formList/', openrosa_form_list, name='openrosa_form_list_slash'),

    # Form management endpoints
    path('api/forms/<int:form_id>/anonymous-setting/', update_form_anonymous_setting, name='update_form_anonymous_setting'),
    path('api/submissions/<int:submission_id>/xml/', get_submission_xml, name='get_submission_xml'),
    path('api/submissions/instance/<str:instance_id>/', views.get_submission_by_instance_id, name='get_submission_by_instance_id'),
    path('api/submissions/<str:instance_id>/status/', views.get_submission_processing_status, name='get_submission_processing_status'),
    path('api/get-user-forms/', views.get_user_forms, name='get_user_forms'),
    path('api/forms-without-submission/', views.get_forms_without_submission, name='get_forms_without_submission'),
    path('api/get-templates-bulk/', views.get_templates_bulk, name='get_templates_bulk'),
    path('api/forms/<int:form_id>/csv/', download_form_csv, name='download_form_csv'),
    path('api/forms/<int:form_id>/media/', list_form_media, name='list_form_media'),
    path('api/forms/<int:form_id>/zip/', download_form_zip, name='download_form_zip'),
    path('api/submissions/<str:instance_id>/validation/', update_submission_validation, name='update_submission_validation'),
    path('api/forms/<int:form_id>/submissions/<str:instance_id>/', delete_submission, name='delete_submission'),
    path(
        'api/projects/<int:project_id>/submissions/soft-delete-bulk/',
        views.bulk_soft_delete_project_submissions,
        name='bulk_soft_delete_project_submissions',
    ),
    path('api/forms/<int:form_id>/download_xls/', generate_xls_download, name='generate_xls_download'),
     path('api/forms/<int:form_id>/download_csv/', download_form_csv, name='download_form_csv'),
    path('api/forms/<int:form_id>/download_zip/', download_form_zip, name='download_form_zip'),
    path('api/forms/<int:form_id>/download_logs/', list_download_logs, name='list_download_logs'),
    path('api/download_logs/<int:log_id>/', delete_download_log, name='delete_download_log'),
    path('api/forms/<int:form_id>/data/<str:instance_id>/enketo/edit/', get_enketo_edit_url, name='get_enketo_edit_url'),
    path('api/enketo/survey/', create_enketo_survey, name='create_enketo_survey'),

    # Enketo authentication endpoints
    path('auth/enketo-login/', enketo_login, name='enketo_login'),
    path('auth/enketo-logout/', logout_enketo, name='enketo_logout'),
    path('api/auth/set-enketo-cookie/', set_enketo_cookie, name='set_enketo_cookie'),
    path('api/debug-auth/', debug_auth, name='debug_auth'),
    path('api/debug-enketo-auth/', debug_enketo_auth, name='debug_enketo_auth'),
    path('api/test-cookie/', test_cookie, name='test_cookie'),

path('api/forms/<int:form_id>/submit/', submit_form, name='submit_form'),
path('api/forms/<int:form_id>/submit-media/', views.submit_form_media, name='submit_form_media'),
    path('api/create-template/', views.create_template, name='create_template'),
    path('api/create-lookup-form/', views.create_lookup_form, name='create_lookup_form'),
    path('api/delete-template/<int:template_id>/', delete_template, name='delete_template'),
    path('api/update-template/<int:template_id>/', update_template, name='update_template'),
    path('api/clone-template/<int:template_id>/', clone_template, name='clone_template'),
    path('api/lookup-form-set-criteria/', lookup_form_set_criteria, name='lookup_form_set_criteria'),

    # Patient endpoints
    path('api/patients/csv/', get_patients_csv, name='get_patients_csv'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += static('/api/media/', document_root=settings.MEDIA_ROOT)
