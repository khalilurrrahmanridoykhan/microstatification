# BRAC Snapshot Maintenance Guide

## Purpose
This flow pre-generates the BRAC Excel export for project `55` so user downloads return quickly without rebuilding the file on every request.

## Runtime Behavior
- Endpoint: `GET /api/get-project-templates-full-xlsx/55/?followup_filter=all`
- Default request (no custom `selected_fields`, no `followup_forms`) serves prepared snapshot.
- If prepared snapshot is missing, API generates it once and stores it, then serves it.
- Non-default requests still run on-demand generation.

## Scheduled Generation
- Celery beat runs task `api.tasks.generate_brac_project_snapshot_task`.
- Default schedule: daily at `01:00` (using `CELERY_TIMEZONE`, default `Asia/Dhaka`).
- Queue: `BRAC_SNAPSHOT_QUEUE` (default `celery`).

## Snapshot Storage
- Default directory: `backend/media/downloads/brac_snapshots`
- Snapshot XLSX (latest): `project_55_followup_all_latest.xlsx`
- Metadata JSON (latest): `project_55_followup_all_latest.json`

## Environment Variables
Set in `.env` as needed:
- `BRAC_SNAPSHOT_ENABLED=true`
- `BRAC_SNAPSHOT_SUBDIR=downloads/brac_snapshots`
- `BRAC_SNAPSHOT_SCHEDULE_HOUR=1`
- `BRAC_SNAPSHOT_SCHEDULE_MINUTE=0`
- `BRAC_SNAPSHOT_QUEUE=celery`
- `CELERY_TIMEZONE=Asia/Dhaka`

## Process Files and Logs
- Celery beat PID: `/tmp/commicplan_clone_celery_beat.pid`
- Celery beat log: `celery-9102-beat.log`
- General Celery log: `celery-9102-general.log`

## Manual Operations
- Start stack: `./start_clone_stack.sh`
- Stop stack: `./stop_clone_stack.sh`
- Manual inline snapshot generation:
```bash
cd backend
set -a
. ../.env
set +a
../.venv/bin/python manage.py generate_brac_snapshot --project-id 55
```
- Enqueue snapshot generation:
```bash
cd backend
set -a
. ../.env
set +a
../.venv/bin/python manage.py generate_brac_snapshot --project-id 55 --enqueue
```

## Verification
- Confirm beat process:
```bash
cat /tmp/commicplan_clone_celery_beat.pid
```
- Confirm snapshot files:
```bash
ls -lh backend/media/downloads/brac_snapshots/
```
- Check recent beat activity:
```bash
tail -n 50 celery-9102-beat.log
```

## Troubleshooting
- If download is slow and `X-Export-Source` is `on_demand`, snapshot may be missing or disabled.
- If snapshot is not refreshing daily:
  - verify beat PID/log
  - verify `CELERY_TIMEZONE` and schedule env vars
  - run manual `generate_brac_snapshot` once
