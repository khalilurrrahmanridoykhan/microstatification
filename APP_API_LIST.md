# App API List (From Flutter Code Scan)

Source scanned:
- `/var/www/ComMicPlanV2_clone/ComMicPlan-Flutter-App/lib`

This document lists APIs your Flutter app currently uses, plus APIs you need for the new All Rows update.

## Base URL Pattern Used by App
Your Flutter code is using production URLs like:
- `https://admin2.commicplan.com/api/api/...`

So in app config you are effectively using this base prefix:
- `https://admin2.commicplan.com/api/api`

For clone/local backend (`9102`), equivalent base is usually:
- `http://119.40.87.37:9102/api`

## Env Keys Used in App
From `ComMicPlan-Flutter-App/lib/.env` and Dart code:
- `LOGIN_URL`
- `CSRF_URL`
- `SIGNUP_URL`
- `PROJECTFETCH_URL`
- `ORGANIZATIONFETCH_URL`
- `FORMFETCH_URL`
- `FORMFETCH_WITHOUT_SUBMISSION_URL`
- `FORM_SUBMIT_URL`
- `MEDIA_UPLOAD_URL`

## APIs Currently Used by Flutter App

### 1) Authentication
1. `GET /csrf-token/`
- Used in: `lib/bloc/backend/authorization/login_auth.dart`
- Purpose: fetch CSRF token before login

2. `POST /auth/login/`
- Used in: `lib/bloc/backend/authorization/login_auth.dart`
- Body:
```json
{
  "username": "...",
  "password": "..."
}
```
- Response used: `token`, `user`

3. `POST /auth/register/` (backend route)
- Used in app via `SIGNUP_URL` in: `lib/bloc/backend/authorization/signup_auth.dart`
- Body:
```json
{
  "username": "...",
  "email": "...",
  "password": "...",
  "first_name": "...",
  "last_name": "..."
}
```

Important:
- Backend route is `/api/auth/register/`.
- Your current `.env` has `SIGNUP_URL = .../api/api/register/` (missing `auth/`).

### 2) User / Profile / Languages
4. `GET /users/{username}/`
- Used in: `lib/bloc/form_only/downloadPage/bloc/download_page_bloc.dart`
- Purpose: refresh user profile and permissions

5. `GET /languages/`
- Used in: `lib/bloc/backend/authorization/login_auth.dart`
- Purpose: cache languages after login

### 3) Organization / Project / Form Fetch
6. `GET /organizations/`
- Used in: `lib/bloc/backend/form/fetch_organizations.dart`

7. `GET /projects/`
- Used in: `lib/bloc/backend/form/fetch_projects.dart`
- App also calls with query: `?organization_id={id}`

Note:
- Backend filtering commonly uses `organization` query param (not `organization_id`).
- If filtering fails, use: `/projects/?organization={id}`.

8. `GET /forms-without-submission/`
- Used in: `lib/bloc/backend/form/fetchForm.dart`
- Also used with query: `?project={projectId}`

9. `GET /forms/`
- Used as fallback in: `lib/bloc/backend/form/fetchForm.dart`

10. `GET /projects/{project_id}/`
- Used fallback path in: `lib/bloc/backend/form/fetchForm.dart`
- Purpose: read `forms` from project detail response

11. `GET /get-user-forms/`
- Used in: `lib/bloc/follow_up/downloadPage/bloc/download_page_bloc.dart`
- Purpose: fetch only forms user can access

12. `GET /get-template/{template_id}/`
- Used in: `lib/bloc/follow_up/downloadPage/bloc/download_page_bloc.dart`

13. `POST /get-templates-bulk/`
- Used in: `lib/bloc/follow_up/downloadPage/bloc/download_page_bloc.dart`
- Body:
```json
{
  "template_ids": [1, 2, 3]
}
```

14. `GET /templates/{template_id}/followup-forms/` (New lightweight API)
- Purpose: get only follow-up forms list for a template + filter questions (no submission payload)
- Auth: required (`Token`)
- Example response:
```json
{
  "template_id": 113,
  "template_name": "Community Diseases Surveillance Reporting",
  "filter_questions": [
    { "name": "hh_id", "label": "HH ID", "type": "text", "make_mandatory": true },
    { "name": "hh_head_name", "label": "HH Head Name", "type": "text", "make_mandatory": true }
  ],
  "forms": [
    {
      "uid": 5062,
      "project": 55,
      "template": 113,
      "display_name": "Community Diseases Surveillance Reporting - 11111 - 11111",
      "submission_uuid": "uuid:4fb5ea59-5454-4927-b1db-c14c275c6817"
    }
  ]
}
```
- Access behavior:
  - Role `4/5`: only forms assigned in `user.profile.forms`
  - Role `6`: only forms from assigned projects
  - Other roles: all generated lookup forms of that template

### 4) Submission APIs
15. `POST /forms/{form_id}/submit/`
- Used in: `lib/bloc/backend/form/submit_form.dart`
- Headers include: `Authorization: Token ...`, `X-CSRFToken` (if present)

16. `POST /forms/{form_id}/submit-media/`
- Used in: `lib/bloc/backend/form/submit_form.dart`
- Multipart upload for media files

## APIs Needed for New All Rows Update (Table + Download)
These are required for implementing your latest web update inside the app:

17. `GET /get-project-templates-paginated/{project_id}/`
- Purpose: data table rows with pagination
- Query params:
  - `page`
  - `page_size`
  - `followup_filter` = `all | with | without`
  - `followup_forms` (optional CSV ids)

18. `GET /get-project-templates-full/{project_id}/`
- Purpose: full export/download data
- Query params:
  - `followup_filter` = `all | with | without`
  - `followup_forms` (optional CSV ids)
  - `selected_fields` (CSV in exact column order)

## All Rows Behavior You Must Keep in App
For these APIs (`paginated` + `full`):
1. If a row has multiple follow-ups, row-level follow-up fields must come from the **earliest/oldest** follow-up.
2. Keep column order segment:
- `total_reporting_sites`
- `division`
- `district`
- `upazila`
- `union`
- `city_corporation`
3. Table display should stop at `submitted_by` if you want same UX as web table.

## Recommended Env Mapping (for current backend routes)
If you align app env to backend routes in this repo, use:

```env
LOGIN_URL=https://admin2.commicplan.com/api/api/auth/login/
CSRF_URL=https://admin2.commicplan.com/api/api/csrf-token/
SIGNUP_URL=https://admin2.commicplan.com/api/api/auth/register/

ORGANIZATIONFETCH_URL=https://admin2.commicplan.com/api/api/organizations/
PROJECTFETCH_URL=https://admin2.commicplan.com/api/api/projects/
FORMFETCH_URL=https://admin2.commicplan.com/api/api/forms/
FORMFETCH_WITHOUT_SUBMISSION_URL=https://admin2.commicplan.com/api/api/forms-without-submission/

FORM_SUBMIT_URL=https://admin2.commicplan.com/api/api/forms
MEDIA_UPLOAD_URL=https://admin2.commicplan.com/api/api/forms
```

Notes:
1. Keep `FORM_SUBMIT_URL` and `MEDIA_UPLOAD_URL` without trailing slash to avoid double slash when app builds `/{formId}/submit/`.
2. If your gateway/base path changes, adjust only prefix; endpoint tails above stay same.
