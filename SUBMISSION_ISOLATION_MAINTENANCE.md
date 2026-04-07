# Submission Isolation Maintenance Guide

## Purpose
This deployment isolates mobile submission traffic from other APIs at both HTTP and Celery queue layers.

## Current Runtime Topology
- `Nginx` routes `POST /api/forms/<id>/submit/` to Gunicorn on `:9112`.
- Other `/api/*` routes go to Gunicorn on `:9102`.
- Submission post-processing Celery tasks go to queue `submission_processing`.
- Non-submission Celery tasks stay on queue `celery`.
- Celery beat schedules daily BRAC snapshot generation (default `01:00` Asia/Dhaka).

## Ports and Processes
- Main API: `:9102` (`/tmp/commicplan_clone_9102.pid`, `gunicorn-9102.*.log`)
- Submit API: `:9112` (`/tmp/commicplan_clone_submit_9112.pid`, `gunicorn-9112.*.log`)
- General Celery worker: `/tmp/commicplan_clone_celery_general.pid`, `celery-9102-general.log`
- Submit Celery worker: `/tmp/commicplan_clone_celery_submit.pid`, `celery-9102-submit.log`
- Celery beat: `/tmp/commicplan_clone_celery_beat.pid`, `celery-9102-beat.log`

## Config Knobs
Set in shell or `.env`:
- `GUNICORN_WORKERS` (default `8`) for `:9102`
- `SUBMIT_GUNICORN_WORKERS` (default `4`) for `:9112`
- `SUBMIT_GUNICORN_TIMEOUT` (default `600`)
- `CELERY_GENERAL_CONCURRENCY` (default `4`)
- `CELERY_SUBMIT_CONCURRENCY` (default `4`)
- `CELERY_GENERAL_QUEUES` (default `celery`)
- `SUBMISSION_CELERY_QUEUE` (default `submission_processing`)
- `BRAC_SNAPSHOT_ENABLED` (default `true`)
- `BRAC_SNAPSHOT_SCHEDULE_HOUR` (default `1`)
- `BRAC_SNAPSHOT_SCHEDULE_MINUTE` (default `0`)
- `BRAC_SNAPSHOT_QUEUE` (default `celery`)
- `BRAC_SNAPSHOT_SUBDIR` (default `downloads/brac_snapshots`)

## Start/Stop Operations
- Start full stack: `./start_clone_stack.sh`
- Stop full stack: `./stop_clone_stack.sh`

The start script also stops the old legacy single Celery worker (`/tmp/commicplan_clone_celery.pid`) if found.

## Health Checks
- Confirm listeners:
```bash
ss -ltnp | rg ':9102|:9112'
```
- Confirm Gunicorn masters:
```bash
cat /tmp/commicplan_clone_9102.pid
cat /tmp/commicplan_clone_submit_9112.pid
```
- Confirm Celery workers:
```bash
cat /tmp/commicplan_clone_celery_general.pid
cat /tmp/commicplan_clone_celery_submit.pid
cat /tmp/commicplan_clone_celery_beat.pid
```
- Confirm routing split:
```bash
rg -n "POST /api/forms/.*/submit/" gunicorn-9112.access.log | tail
rg -n "GET /api/projects/" gunicorn-9102.access.log | tail
```

## Queue Backlog Checks
Use the Redis DB index from `CELERY_BROKER_URL` in `.env` (this server currently uses DB `1`):
```bash
redis-cli -n 1 LLEN submission_processing
redis-cli -n 1 LLEN celery
```

Interpretation:
- High `submission_processing` queue length means submit worker is undersized or blocked.
- High `celery` queue length means non-submit tasks are falling behind.

## Safe Scaling Procedure
1. Increase only one tier at a time.
2. Start with submit path first:
   - `SUBMIT_GUNICORN_WORKERS`
   - `CELERY_SUBMIT_CONCURRENCY`
3. Watch DB load before scaling further:
   - PostgreSQL connections
   - DB CPU / slow queries
4. Keep submit and general pools separate.

## Reload Procedure After Code Changes
- Reload Gunicorn without full stop:
```bash
kill -HUP "$(cat /tmp/commicplan_clone_9102.pid)"
kill -HUP "$(cat /tmp/commicplan_clone_submit_9112.pid)"
```
- Restart Celery workers:
```bash
kill "$(cat /tmp/commicplan_clone_celery_general.pid)" || true
kill "$(cat /tmp/commicplan_clone_celery_submit.pid)" || true
kill "$(cat /tmp/commicplan_clone_celery_beat.pid)" || true
./start_clone_stack.sh
```

## Troubleshooting
- Symptom: submit requests are slow, other APIs are fine.
  - Check `gunicorn-9112.error.log` and `celery-9102-submit.log`.
- Symptom: submit accepted (`201`) but downstream processing delayed.
  - Check `submission_processing` queue length and submit Celery worker PID.
- Symptom: all APIs slow.
  - Isolation is working, but DB is still shared. Inspect DB saturation.

## Rollback
1. Route submit API back to `:9102` in nginx.
2. Stop submit Gunicorn (`/tmp/commicplan_clone_submit_9112.pid`).
3. Stop submit Celery worker (`/tmp/commicplan_clone_celery_submit.pid`).
4. Reload nginx and keep only main API + general Celery worker.

## Important Limitation
This setup isolates app-worker and queue pressure, but **database pressure is still shared**. If PostgreSQL is saturated, both submit and non-submit APIs can still degrade.
