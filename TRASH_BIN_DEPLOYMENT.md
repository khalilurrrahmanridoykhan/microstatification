# TrashBin Deployment Guide

This guide will help you deploy the trash bin functionality to your production server.

## Server Status Analysis

Based on your `showmigrations` output, your server has:

- Migrations up to `0038_patient`
- Missing the TrashBin functionality

## Files to Upload to Server

Upload these new files to your server's backend directory:

### 1. Migration File

```
backend/api/migrations/0039_trashbin_patient_is_deleted_patient_deleted_at.py
```

### 2. Model Updates

```
backend/api/models.py (updated with TrashBin model)
backend/api/serializers.py (updated with TrashBin serializers)
backend/api/views.py (updated with TrashBin views)
backend/api/utils.py (new file with trash utilities)
```

### 3. Management Command

```
backend/api/management/commands/cleanup_trash.py
```

### 4. Celery Tasks (optional)

```
backend/api/tasks.py (updated with trash cleanup tasks)
```

### 5. URL Configuration

Make sure `backend/api/urls.py` or `backend/backend/urls.py` includes the TrashBin routes.

### 6. Frontend Files

```
frontend/src/shared/TrashBin.jsx
frontend/src/App.jsx (updated with trash-bin routes)
frontend/src/Admin/Components/Dashboard/DashboardSidebar.jsx (updated)
frontend/src/Organization/Components/Dashboard/DashboardSidebar.jsx (updated)
frontend/src/Project/Components/Dashboard/DashboardSidebar.jsx (updated)
frontend/src/User/Components/Dashboard/DashboardSidebar.jsx (updated)
```

## Deployment Steps

### Step 1: Upload Files

Upload all the files listed above to your server.

### Step 2: Run Deployment Script

```bash
cd /opt/ComMicPlanV2/backend
python deploy_trash_bin.py
```

This script will:

- Create and apply migrations
- Test the setup
- Verify everything works

### Step 3: Verify Installation

```bash
python verify_trash_bin.py
```

This will check if all components are working correctly.

### Step 4: Restart Services

```bash
# Restart your web server
sudo systemctl restart gunicorn  # or your web server
sudo systemctl restart nginx     # if using nginx

# If using Celery
sudo systemctl restart celery
sudo systemctl restart celery-beat
```

### Step 5: Test the Interface

1. Log in to your web application
2. Navigate to "Trash Bin" in the sidebar
3. Try deleting and restoring items

## Manual Migration (Alternative)

If the deployment script doesn't work, run these commands manually:

```bash
cd /opt/ComMicPlanV2/backend

# Apply the migration
python manage.py migrate

# Check migration status
python manage.py showmigrations api

# Verify TrashBin table exists
python manage.py shell
>>> from api.models import TrashBin
>>> TrashBin.objects.count()
>>> exit()
```

## Troubleshooting

### If Migration Fails

1. Check if migration file `0039_trashbin_patient_is_deleted_patient_deleted_at.py` exists
2. Make sure dependencies are correct in the migration file
3. Try running `python manage.py showmigrations` to see current state

### If Frontend Doesn't Show Trash Bin

1. Make sure React app is built and deployed: `npm run build`
2. Check if routes are added to App.jsx
3. Verify sidebar components have the trash bin menu item

### If API Doesn't Work

1. Check if `api/urls.py` includes trash bin routes
2. Verify `api/views.py` has TrashBinViewSet
3. Make sure `api/serializers.py` has TrashBin serializers

## Features After Deployment

✅ **Soft Delete System**: Items are moved to trash instead of permanent deletion
✅ **30-Day Auto Cleanup**: Items automatically deleted after 30 days
✅ **Restore Functionality**: Restore items from trash bin
✅ **Trash Bin Interface**: Web interface to manage deleted items
✅ **API Endpoints**: RESTful API for trash operations
✅ **User Permissions**: Only show user's own deleted items
✅ **Statistics**: View trash bin statistics and expiry info

## Optional: Celery Setup for Auto-Cleanup

If you want automatic cleanup, set up Celery beat:

```bash
# Add to your Celery beat schedule
python manage.py shell
>>> from django_celery_beat.models import PeriodicTask, CrontabSchedule
>>> schedule, created = CrontabSchedule.objects.get_or_create(
...     minute=0, hour=2, day_of_week='*', day_of_month='*', month_of_year='*'
... )
>>> PeriodicTask.objects.create(
...     crontab=schedule,
...     name='Cleanup Expired Trash',
...     task='api.tasks.cleanup_expired_trash_task',
... )
>>> exit()
```

## Contact

If you encounter any issues during deployment, please provide:

1. Error messages from the deployment script
2. Output of `python manage.py showmigrations api`
3. Any console errors from the web interface
