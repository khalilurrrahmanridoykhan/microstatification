# ComMicPlan System Technical Documentation

**Version:** 1.0
**Date:** December 21, 2025
**Authors:** [Your Name/Team]
**Repository:** [GitHub Links: ComMicPlanV2, ComMicPlan-Flutter-App]

This document provides comprehensive technical documentation for the ComMicPlan system, including frontend, backend, Enketo integration, mobile app, deployment, and maintenance. It is intended for developers, maintainers, and stakeholders.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture and Design](#architecture-and-design)
3. [Frontend Documentation](#frontend-documentation)
4. [Backend Documentation](#backend-documentation)
5. [Enketo Integration Documentation](#enketo-integration-documentation)
6. [Mobile App Documentation](#mobile-app-documentation)
7. [Deployment and Infrastructure](#deployment-and-infrastructure)
8. [Security and Compliance](#security-and-compliance)
9. [Maintenance and Troubleshooting](#maintenance-and-troubleshooting)
10. [Contributing and Development](#contributing-and-development)

---

## System Overview

### Purpose and Scope

ComMicPlan is a comprehensive data collection and management system designed for health planning and monitoring. It enables field workers to collect data via forms, admins to manage and analyze submissions, and stakeholders to generate reports. The system supports offline/online data sync, real-time dashboards, and integration with external tools like Enketo for form rendering.

### High-Level Architecture

The system consists of three main components:

- **Frontend:** Web interface for dashboards and data visualization.
- **Backend:** API server for data processing, authentication, and storage.
- **Enketo:** External form rendering service for data collection.

Data flow: Mobile/Frontend → Backend APIs → Database. Enketo submits forms directly to backend.

![Architecture Diagram](https://example.com/architecture-diagram.png) <!-- Replace with actual diagram link -->

### Technologies Used

- **Frontend:** React.js, Vite, Tailwind CSS.
- **Backend:** Django (Python), PostgreSQL, Celery, Redis.
- **Enketo:** Custom ODK-based form renderer.
- **Mobile:** Flutter (Dart).
- **Other:** Nginx, Docker, GitHub Actions.

### Key Features

- User authentication and role-based access.
- Form creation and submission (via Enketo).
- Data sync (offline/online).
- Reporting and analytics.
- Mobile app for field data collection.

---

## Architecture and Design

### Component Breakdown

- **Frontend (dev.commicplan.com):** Web interface for dashboards and data visualization, built with React.js.
- **Backend (admin2.commicplan.com):** API server for data processing, authentication, and storage, built with Django.
- **Enketo (enketo2.commicplan.com):** External form rendering service for data collection, integrated via OpenRosa API.
- **Mobile App:** Flutter-based app for offline/online data sync.
- **Database:** PostgreSQL for data storage.
- **Additional Services:** Redis for caching, Celery for background tasks, Nginx for load balancing.

### Data Flow

1. Users access the frontend web app for dashboards and form management.
2. Mobile app syncs data offline/online via REST APIs to the backend.
3. Enketo fetches form definitions from the backend and submits data directly.
4. Backend processes requests, interacts with the database, and handles authentication.
5. Background tasks (e.g., report generation) are handled by Celery workers.

### System Architecture Diagram

Below is a Mermaid diagram illustrating the high-level architecture:

```mermaid
graph TB
    subgraph "User Layer"
        A[Web Browser] --> F[Frontend (React.js)]
        B[Mobile App (Flutter)] --> F
        C[Field Workers] --> E[Enketo Form Renderer]
    end

    subgraph "Application Layer"
        F --> D[Backend (Django API)]
        E --> D
        D --> G[Celery Workers]
        D --> H[Redis Cache]
    end

    subgraph "Data Layer"
        D --> I[PostgreSQL Database]
        G --> I
    end

    subgraph "Infrastructure"
        J[Nginx Load Balancer]
        K[Docker Containers]
        L[GitHub Actions CI/CD]
    end

    J --> D
    K --> D
    L --> F
    L --> D
```

### Detailed Component Interactions

- **Frontend ↔ Backend:** RESTful API calls with JWT authentication. Frontend fetches data for dashboards and sends user inputs.
- **Mobile App ↔ Backend:** Syncs submissions and forms via APIs, supports offline mode with local storage.
- **Enketo ↔ Backend:** Uses OpenRosa standard for form XML retrieval and submission. CORS enabled for cross-origin requests.
- **Backend ↔ Database:** ORM (Django models) for CRUD operations.
- **Background Tasks:** Celery processes async jobs like data exports or notifications.
- **Caching:** Redis stores session data and API responses for performance.
- **Security:** All communications use HTTPS/TLS. Role-based access controls enforced at API level.

### Scalability and Reliability

- **Horizontal Scaling:** Backend can be scaled with multiple instances behind Nginx.
- **Database Replication:** PostgreSQL supports read replicas for high availability.
- **Monitoring:** Integrate tools like Prometheus for metrics and Sentry for error tracking.

### Database Schema

- **Users Table:** id (PK), username, email, role, organization_id (FK).
- **Forms Table:** id (PK), title, schema (JSON), project_id (FK), created_by (FK).
- **Submissions Table:** id (PK), form_id (FK), data (JSON), instance_id, submitted_at.
- **Projects Table:** id (PK), name, description, organization_id (FK).
- **Organizations Table:** id (PK), name, settings (JSON).
- **Relationships:** One-to-many (Projects → Forms → Submissions), Many-to-one (Users → Organizations).

![ER Diagram](https://example.com/er-diagram.png) <!-- Replace with actual ER diagram -->

### APIs and Integrations

- **Internal APIs:** RESTful endpoints for CRUD operations (detailed in Backend section).
- **External Integrations:** Enketo for form rendering, potential third-party APIs for analytics or notifications.
- **Authentication:** JWT-based, with CSRF protection for web requests.

### Security Model

- **Authentication:** JWT tokens issued by backend, validated on each request.
- **Authorization:** Role-based (e.g., Admin, User, Viewer) with permissions checked per endpoint.
- **Data Encryption:** TLS 1.3 for all external communications, AES-256 for sensitive data at rest.
- **Compliance:** Adheres to data protection standards (e.g., GDPR, HIPAA if applicable). Regular security audits recommended.

---

## Frontend Documentation

### Tech Stack

- Framework: React.js
- Build Tool: Vite
- Styling: Tailwind CSS
- Libraries: Axios (API calls), React Router

### Setup and Installation

1. Prerequisites: Node.js 18+, npm.
2. Clone repo: `git clone https://github.com/khalilurrrahmanridoykhan/ComMicPlanV2.git`
3. Install: `npm install`
4. Environment: Create `.env` with `REACT_APP_API_URL=https://admin2.commicplan.com`

### Development Guide

- Run: `npm run dev`
- Build: `npm run build`
- Folder Structure:
  ```
  src/
    components/
    pages/
    services/  # API calls
  ```

### Deployment

- Host: [Server details, e.g., AWS EC2]
- CI/CD: GitHub Actions for build/deploy.
- Domain: dev.commicplan.com (via Nginx proxy).

### Key Components

- Login Page: Authenticates users.
- Dashboard: Displays reports and data.

### Testing

- Run tests: `npm test`
- Coverage: Jest for unit tests.

---

## Backend Documentation

### Tech Stack

- Framework: Django 4.x
- Language: Python 3.12
- Database: PostgreSQL
- Tools: Celery (tasks), Redis (cache)

### Setup and Installation

1. Prerequisites: Python 3.12, PostgreSQL.
2. Clone: `git clone https://github.com/khalilurrrahmanridoykhan/ComMicPlanV2.git`
3. Virtualenv: `python -m venv venv && source venv/bin/activate`
4. Install: `pip install -r requirements.txt`
5. DB Setup: `python manage.py migrate`
6. Environment: `.env` with DB credentials, SECRET_KEY.

### API Endpoints

Base URL: `https://admin2.commicplan.com/api/`

#### Authentication

- `POST /auth/login/`: User login (returns JWT token).
- `POST /auth/register/`: User registration.
- `GET /csrf-token/`: Get CSRF token.

#### Forms (CRUD via Router)

- `GET /forms/`: List all forms.
- `POST /forms/`: Create a new form.
- `GET /forms/<id>/`: Retrieve a specific form.
- `PUT /forms/<id>/`: Update a form.
- `DELETE /forms/<id>/`: Delete a form.
- `POST /projects/<pk>/create_form/`: Create form under a project.
- `PUT /forms/<form_id>/translations/`: Update form translations.
- `PUT /forms/<form_id>/anonymous-setting/`: Update anonymous submission setting.
- `POST /forms/<form_id>/submit/`: Submit form data.
- `POST /forms/<form_id>/submit-media/`: Submit form with media.

#### Submissions (CRUD via Router)

- `GET /submissions/`: List all submissions.
- `POST /submissions/`: Create a new submission.
- `GET /submissions/<id>/`: Retrieve a specific submission.
- `PUT /submissions/<id>/`: Update a submission.
- `DELETE /submissions/<id>/`: Delete a submission.
- `GET /submissions/<submission_id>/xml/`: Get submission XML.
- `GET /submissions/instance/<instance_id>/`: Get submission by instance ID.
- `PUT /submissions/<instance_id>/validation/`: Update submission validation status.
- `DELETE /forms/<form_id>/submissions/<instance_id>/`: Delete a specific submission.

#### Projects (CRUD via Router)

- `GET /projects/`: List all projects.
- `POST /projects/`: Create a new project.
- `GET /projects/<id>/`: Retrieve a specific project.
- `PUT /projects/<id>/`: Update a project.
- `DELETE /projects/<id>/`: Delete a project.
- `GET /get-project-templates/<project_id>/`: Get project templates.
- `GET /get-project-templates-paginated/<project_id>/`: Get paginated project templates.
- `GET /get-project-templates-full/<project_id>/`: Get full project templates.
- `GET /get-all-projects/`: List all projects.

#### Languages (CRUD via Router)

- `GET /languages/`: List all languages.
- `POST /languages/`: Create a new language.
- `GET /languages/<id>/`: Retrieve a specific language.
- `PUT /languages/<id>/`: Update a language.
- `DELETE /languages/<id>/`: Delete a language.

#### Users (CRUD via Router)

- `GET /users/`: List all users.
- `POST /users/`: Create a new user.
- `GET /users/<id>/`: Retrieve a specific user.
- `PUT /users/<id>/`: Update a user.
- `DELETE /users/<id>/`: Delete a user.
- `GET /get-current-user-profile/`: Get current user profile.

#### Organizations (CRUD via Router)

- `GET /organizations/`: List all organizations.
- `POST /organizations/`: Create a new organization.
- `GET /organizations/<id>/`: Retrieve a specific organization.
- `PUT /organizations/<id>/`: Update an organization.
- `DELETE /organizations/<id>/`: Delete an organization.

#### Patients (CRUD via Router)

- `GET /patients/`: List all patients.
- `POST /patients/`: Create a new patient.
- `GET /patients/<id>/`: Retrieve a specific patient.
- `PUT /patients/<id>/`: Update a patient.
- `DELETE /patients/<id>/`: Delete a patient.
- `GET /patients/csv/`: Download patients as CSV.

#### Trash Bin (CRUD via Router)

- `GET /trash/`: List trash items.
- `POST /trash/`: Create a trash item.
- `GET /trash/<id>/`: Retrieve a specific trash item.
- `PUT /trash/<id>/`: Update a trash item.
- `DELETE /trash/<id>/`: Delete a trash item.

#### Templates

- `POST /create-template/`: Create a new template.
- `POST /create-lookup-form/`: Create a lookup form.
- `GET /get-template/<template_id>/`: Get a specific template.
- `DELETE /delete-template/<template_id>/`: Delete a template.
- `PUT /update-template/<template_id>/`: Update a template.
- `POST /clone-template/<template_id>/`: Clone a template.
- `GET /get-templates-bulk/`: Get bulk templates.

#### Downloads and Media

- `GET /forms/<form_id>/csv/`: Download form data as CSV.
- `GET /forms/<form_id>/media/`: List form media.
- `GET /forms/<form_id>/zip/`: Download form as ZIP.
- `GET /forms/<form_id>/download_xls/`: Generate XLS download.
- `GET /forms/<form_id>/download_csv/`: Download form CSV.
- `GET /forms/<form_id>/download_zip/`: Download form ZIP.
- `GET /forms/<form_id>/download_logs/`: List download logs.
- `DELETE /download_logs/<log_id>/`: Delete a download log.

#### OpenRosa API (for Enketo)

- `GET /openrosa/forms/<form_id>/form.xml`: Get form XML.
- `POST /openrosa/submission/`: Submit data via OpenRosa.
- `GET /openrosa/formList`: List forms for OpenRosa.

#### Enketo Integration

- `GET /forms/<form_id>/data/<instance_id>/enketo/edit/`: Get Enketo edit URL.
- `POST /auth/set-enketo-cookie/`: Set Enketo cookie.
- `POST /auth/enketo-login/`: Login to Enketo.
- `POST /auth/enketo-logout/`: Logout from Enketo.

#### Dashboard and Utilities

- `GET /dashboard/summary/`: Get dashboard summary.
- `GET /get-user-forms/`: Get forms for current user.
- `GET /forms-without-submission/`: Get forms without submissions.
- `POST /lookup-form-set-criteria/`: Set lookup form criteria.
- `POST /convert/xlsform/`: Convert XLSForm.

#### Debug and Testing

- `GET /debug-auth/`: Debug authentication.
- `GET /debug-enketo-auth/`: Debug Enketo auth.
- `GET /test-cookie/`: Test cookie.

Example:

```json
{
  "method": "POST",
  "endpoint": "/submissions/",
  "body": {"form_id": 1, "data": {...}}
}
```

### Models and Serializers

- **User Model:** Fields: username, email, role.
- **Serializer:** Converts to JSON for APIs.

### Deployment

- Server: Gunicorn + Nginx.
- Domain: admin2.commicplan.com.
- SSL: Let's Encrypt.

### Background Tasks

- Celery workers for data processing (e.g., report generation).

### Testing

- Run: `python manage.py test`
- Fixtures: Use for test data.

---

## Enketo Integration Documentation

### Purpose

Enketo renders ODK forms for data collection, supporting offline submissions and syncing to backend.

### Integration Details

- Fetches forms via backend API.
- Submits data to `/api/openrosa/submissions/`.
- CORS: Allow origin `https://enketo2.commicplan.com`.

### Setup

1. Install Enketo: [Link to docs].
2. Configure: API keys, backend URL.

### Customization

- Themes: Custom CSS.
- Plugins: [List if any].

### Deployment

- Host: [Server details].
- Domain: enketo2.commicplan.com.

---

## Mobile App Documentation

### Tech Stack

- Framework: Flutter (Dart)
- Platforms: Android, iOS

### Setup

1. Prerequisites: Flutter SDK.
2. Clone: `git clone https://github.com/khalilurrrahmanridoykhan/ComMicPlan-Flutter-App.git`
3. Install: `flutter pub get`

### Features

- Offline data collection.
- Sync to backend via APIs.

### Build and Deployment

- Build: `flutter build apk`
- App Stores: Google Play, App Store.
- CI/CD: GitHub Actions.

---

## Deployment and Infrastructure

### Environment Setup

- Dev: Local Docker.
- Prod: AWS EC2, PostgreSQL RDS.

### CI/CD Pipeline

- GitHub Actions: Build on push, deploy to servers.

### Monitoring and Logging

- Tools: Sentry (errors), CloudWatch (logs).

### Backup and Recovery

- DB Backups: Daily via cron.

### Scaling

- Load Balancer: Nginx for multiple instances.

---

## Security and Compliance

### Authentication and Authorization

- JWT for sessions.
- Roles: Admin, User.

### Data Protection

- Encryption: TLS 1.3, AES-256.

### Vulnerabilities

- Regular scans; patch updates.

### Compliance

- [e.g., GDPR for data handling].

---

## Maintenance and Troubleshooting

### Common Issues

- API Timeout: Check network/load.
- Sync Failure: Verify API keys.

### Logs and Debugging

- Logs: `/var/log/nginx/`, Django logs.

### Updates

- Versioning: Semantic versioning.
- Rollback: Git revert.

### Performance

- Monitor: CPU, memory via tools.

---

## Contributing and Development

### Code Style

- Frontend: ESLint.
- Backend: Black, Flake8.

### Branching Strategy

- Feature branches, PRs to main.

### Testing Strategy

- Unit: Jest/Pytest.
- E2E: Cypress.

### Contact

- Email: [team@example.com]

---

For updates, refer to the repository README or contact the team. This document is version-controlled.
