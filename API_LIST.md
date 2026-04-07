# ComMicPlan API List

This list is based on `backend/backend/urls.py`, plus ViewSet actions and function-based views in `backend/api/views.py` and `backend/api/auth_views.py`.

Base paths
- API base path is `/api/`.
- Enketo auth endpoints are under `/auth/` (not `/api/`).
- Django admin is under `/admin/`.

Authentication
- Primary auth is DRF token auth via `/api/auth/login/`.
- Use `Authorization: Token <token>` or `Authorization: Bearer <token>` for authenticated endpoints.
- Some endpoints allow anonymous access (noted below), including OpenRosa and XLSForm conversion.

## Auth & Session
| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/login/` | Login, returns token and user payload. |
| POST | `/api/auth/register/` | Create user (requires auth). |
| GET, POST, HEAD | `/api/csrf-token/` | CSRF token + `__csrf` cookie (AllowAny). |
| POST | `/api/auth/set-enketo-cookie/` | Set `commicplan_auth` cookie. |
| GET | `/api/debug-auth/` | Debug auth cookie info. |
| GET | `/api/debug-enketo-auth/` | Debug Enketo auth cookie info. |
| GET | `/api/test-cookie/` | Sets a test cookie. |
| GET, POST | `/auth/enketo-login/` | Enketo login flow (non-API). |
| POST | `/auth/enketo-logout/` | Enketo logout (non-API). |

## Dashboard
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/dashboard/summary/` | Summary counts and charts. |

## Users
| Method | Path | Notes |
| --- | --- | --- |
| GET, POST | `/api/users/` | List and create users. |
| GET, PUT, PATCH, DELETE | `/api/users/{username}/` | User detail by username. |
| GET | `/api/users/list-view/` | Paginated list with filters (organization, project, form, created_from/to, created_by, search, page, page_size). |
| GET | `/api/users/basic-list/` | Lightweight id/username/email list. |
| GET | `/api/users/user-list/` | Lightweight id/username/email/role list. |
| GET | `/api/get-current-user-profile/` | Current user + assigned organizations. |

## Organizations
| Method | Path | Notes |
| --- | --- | --- |
| GET, POST | `/api/organizations/` | List and create organizations. |
| GET, PUT, PATCH, DELETE | `/api/organizations/{id}/` | Organization detail. |

## Projects
| Method | Path | Notes |
| --- | --- | --- |
| GET, POST | `/api/projects/` | List and create projects. Supports `organization` and `include_forms` query params. |
| GET, PUT, PATCH, DELETE | `/api/projects/{id}/` | Project detail. |
| GET | `/api/projects/user-projects/` | Projects assigned to or created by current user. |
| GET | `/api/projects/{id}/forms/` | Forms for a project. |
| POST | `/api/projects/{id}/create_form/` | Create form under project. |
| GET | `/api/get-all-projects/` | All projects (custom endpoint). |
| GET | `/api/get-project-templates/{project_id}/` | Templates for a project. |
| GET | `/api/get-project-templates-paginated/{project_id}/` | Paginated templates for a project. |
| GET | `/api/get-project-templates-full/{project_id}/` | Full template payloads. |

## Forms
| Method | Path | Notes |
| --- | --- | --- |
| GET, POST | `/api/forms/` | List and create forms. |
| GET, PUT, PATCH, DELETE | `/api/forms/{id}/` | Form detail. Delete moves to trash. |
| POST | `/api/forms/{id}/create_form/` | Same handler as project create_form (router action). |
| GET | `/api/forms/{id}/xlsx/` | Download XLSX for a form. |
| PUT | `/api/forms/{form_id}/translations/` | Update translations. |
| PATCH | `/api/forms/{form_id}/anonymous-setting/` | Update anonymous submission setting. |
| GET | `/api/get-user-forms/` | Optimized list of forms assigned to current user. |
| GET | `/api/forms-without-submission/` | Forms without submissions. |
| POST | `/api/forms/{form_id}/submit/` | Submit form (Token or Basic Auth). |
| POST | `/api/forms/{form_id}/submit-media/` | Submit media files (multipart). |
| GET | `/api/forms/{form_id}/media/` | List form media. |
| GET | `/api/forms/{form_id}/data/{instance_id}/enketo/edit/` | Enketo edit URL. |

## Submissions
| Method | Path | Notes |
| --- | --- | --- |
| GET, POST | `/api/submissions/` | List and create submissions. |
| GET, PUT, PATCH, DELETE | `/api/submissions/{id}/` | Submission detail. Delete moves to trash. |
| GET | `/api/submissions/{submission_id}/xml/` | Get submission XML. |
| GET | `/api/submissions/instance/{instance_id}/` | Lookup by instance ID. |
| PATCH | `/api/submissions/{instance_id}/validation/` | Update validation by instance ID. |
| DELETE | `/api/forms/{form_id}/submissions/{instance_id}/` | Delete by instance ID under form. |

## Downloads & Logs
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/forms/{form_id}/csv/` | Download form CSV. |
| GET | `/api/forms/{form_id}/zip/` | Download form ZIP. |
| POST | `/api/forms/{form_id}/download_xls/` | Generate XLSX download. |
| GET | `/api/forms/{form_id}/download_csv/` | Same CSV download as `/csv/`. |
| GET | `/api/forms/{form_id}/download_zip/` | Same ZIP download as `/zip/`. |
| GET | `/api/forms/{form_id}/download_logs/` | List download logs for form. |
| DELETE | `/api/download_logs/{log_id}/` | Delete a download log entry. |

## Templates & XLSForm
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/get-template/{template_id}/` | Get template by id. |
| POST | `/api/create-template/` | Create template. |
| POST | `/api/create-lookup-form/` | Create lookup form. |
| DELETE | `/api/delete-template/{template_id}/` | Delete template. |
| PATCH | `/api/update-template/{template_id}/` | Update template. |
| POST | `/api/clone-template/{template_id}/` | Clone template. |
| POST | `/api/lookup-form-set-criteria/` | Set criteria for lookup form. |
| POST | `/api/get-templates-bulk/` | Bulk template details. |
| POST, HEAD | `/api/convert/xlsform/` | Convert XLSForm to XForm XML (AllowAny). |

## OpenRosa
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/openrosa/forms/{form_id}/form.xml` | XForm XML for a form (AllowAny). |
| POST, HEAD | `/api/openrosa/submission/` | OpenRosa submission endpoint (AllowAny). |
| GET, POST, HEAD | `/api/openrosa/formList` | OpenRosa form list (AllowAny). |
| GET, POST, HEAD | `/api/openrosa/formList/` | Same as above with trailing slash (AllowAny). |

## Languages
| Method | Path | Notes |
| --- | --- | --- |
| GET, POST | `/api/languages/` | List and create languages. |
| GET, PUT, PATCH, DELETE | `/api/languages/{id}/` | Language detail. |

## Patients
| Method | Path | Notes |
| --- | --- | --- |
| GET, POST | `/api/patients/` | List and create patients. |
| GET, PUT, PATCH, DELETE | `/api/patients/{id}/` | Patient detail. Delete moves to trash. |
| GET | `/api/patients/search/` | Search patients (`q` query param). |
| GET | `/api/patients/{id}/submissions/` | Submissions for a patient. |
| GET | `/api/patients/{id}/submissions_csv/` | CSV of patient submissions. |
| GET | `/api/patients/csv/` | CSV of all patients. |

## Trash Bin
| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/trash/` | List trash items. |
| GET, DELETE | `/api/trash/{id}/` | Trash item detail, delete permanently. |
| POST | `/api/trash/{id}/restore/` | Restore a trash item. |
| POST | `/api/trash/cleanup_expired/` | Cleanup expired trash (admin only). |
| GET | `/api/trash/stats/` | Trash bin statistics. |
