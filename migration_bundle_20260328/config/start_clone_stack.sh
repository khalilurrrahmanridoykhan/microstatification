#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/var/www/ComMicPlanV2_clone_2_Mar"
BACKEND_DIR="$BASE_DIR/backend"
PID_FILE="/tmp/commicplan_clone2_9202.pid"
SUBMIT_PID_FILE="/tmp/commicplan_clone2_submit_9212.pid"
LEGACY_CELERY_PID_FILE="/tmp/commicplan_clone2_celery.pid"
CELERY_GENERAL_PID_FILE="/tmp/commicplan_clone2_celery_general.pid"
CELERY_SUBMIT_PID_FILE="/tmp/commicplan_clone2_celery_submit.pid"
CELERY_BEAT_PID_FILE="/tmp/commicplan_clone2_celery_beat.pid"
CELERY_BEAT_SCHEDULE_FILE="${CELERY_BEAT_SCHEDULE_FILE:-$BASE_DIR/celerybeat-schedule-9202.db}"
if [ -f "$BASE_DIR/.env" ]; then
  # shellcheck disable=SC1091
  . "$BASE_DIR/.env"
fi

GUNICORN_WORKERS="${GUNICORN_WORKERS:-1}"
SUBMIT_GUNICORN_WORKERS="${SUBMIT_GUNICORN_WORKERS:-1}"
SUBMIT_GUNICORN_TIMEOUT="${SUBMIT_GUNICORN_TIMEOUT:-600}"
CELERY_GENERAL_CONCURRENCY="${CELERY_GENERAL_CONCURRENCY:-1}"
CELERY_SUBMIT_CONCURRENCY="${CELERY_SUBMIT_CONCURRENCY:-1}"
CELERY_GENERAL_QUEUES="${CELERY_GENERAL_QUEUES:-celery_9200}"
SUBMISSION_CELERY_QUEUE="${SUBMISSION_CELERY_QUEUE:-submission_processing_9200}"
ENABLE_CELERY="${ENABLE_CELERY:-false}"
ENABLE_CELERY="$(printf '%s' "$ENABLE_CELERY" | tr '[:upper:]' '[:lower:]')"

port_in_use() {
  local p="$1"
  ss -ltn | awk '{print $4}' | grep -q ":${p}$"
}

start_backend() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Backend already running on 9202"
    return
  fi

  if port_in_use 9202; then
    echo "Port 9202 is already in use; aborting backend start"
    exit 1
  fi

  cd "$BACKEND_DIR"
  set -a
  . ../.env
  set +a

  "$BASE_DIR/.venv/bin/gunicorn" backend.wsgi:application \
    --bind 127.0.0.1:9202 \
    --workers "$GUNICORN_WORKERS" \
    --timeout 600 \
    --pid "$PID_FILE" \
    --access-logfile "$BASE_DIR/gunicorn-9202.access.log" \
    --error-logfile "$BASE_DIR/gunicorn-9202.error.log" \
    --daemon

  echo "Backend started on 9202 with $GUNICORN_WORKERS workers"
}

start_submit_backend() {
  if [ -f "$SUBMIT_PID_FILE" ] && kill -0 "$(cat "$SUBMIT_PID_FILE")" 2>/dev/null; then
    echo "Submit backend already running on 9212"
    return
  fi

  if port_in_use 9212; then
    echo "Port 9212 is already in use; aborting submit backend start"
    exit 1
  fi

  cd "$BACKEND_DIR"
  set -a
  . ../.env
  set +a

  "$BASE_DIR/.venv/bin/gunicorn" backend.wsgi:application \
    --bind 127.0.0.1:9212 \
    --workers "$SUBMIT_GUNICORN_WORKERS" \
    --timeout "$SUBMIT_GUNICORN_TIMEOUT" \
    --pid "$SUBMIT_PID_FILE" \
    --access-logfile "$BASE_DIR/gunicorn-9212.access.log" \
    --error-logfile "$BASE_DIR/gunicorn-9212.error.log" \
    --daemon

  echo "Submit backend started on 9212 with $SUBMIT_GUNICORN_WORKERS workers"
}

start_celery() {
  cd "$BACKEND_DIR"
  set -a
  . ../.env
  set +a

  if [ -f "$LEGACY_CELERY_PID_FILE" ] && kill -0 "$(cat "$LEGACY_CELERY_PID_FILE")" 2>/dev/null; then
    kill "$(cat "$LEGACY_CELERY_PID_FILE")" || true
    rm -f "$LEGACY_CELERY_PID_FILE"
  fi

  if [ -f "$CELERY_GENERAL_PID_FILE" ] && kill -0 "$(cat "$CELERY_GENERAL_PID_FILE")" 2>/dev/null; then
    echo "General Celery worker already running"
  else
    "$BASE_DIR/.venv/bin/celery" -A backend worker -l info \
      --hostname="clone2-general@%h" \
      --queues="$CELERY_GENERAL_QUEUES" \
      --concurrency="$CELERY_GENERAL_CONCURRENCY" \
      --pidfile="$CELERY_GENERAL_PID_FILE" \
      --logfile="$BASE_DIR/celery-9202-general.log" \
      --detach
    echo "General Celery worker started (queues: $CELERY_GENERAL_QUEUES, concurrency: $CELERY_GENERAL_CONCURRENCY)"
  fi

  if [ -f "$CELERY_SUBMIT_PID_FILE" ] && kill -0 "$(cat "$CELERY_SUBMIT_PID_FILE")" 2>/dev/null; then
    echo "Submit Celery worker already running"
  else
    "$BASE_DIR/.venv/bin/celery" -A backend worker -l info \
      --hostname="clone2-submit@%h" \
      --queues="$SUBMISSION_CELERY_QUEUE" \
      --concurrency="$CELERY_SUBMIT_CONCURRENCY" \
      --pidfile="$CELERY_SUBMIT_PID_FILE" \
      --logfile="$BASE_DIR/celery-9202-submit.log" \
      --detach
    echo "Submit Celery worker started (queue: $SUBMISSION_CELERY_QUEUE, concurrency: $CELERY_SUBMIT_CONCURRENCY)"
  fi

  if [ -f "$CELERY_BEAT_PID_FILE" ] && kill -0 "$(cat "$CELERY_BEAT_PID_FILE")" 2>/dev/null; then
    echo "Celery beat already running"
  else
    "$BASE_DIR/.venv/bin/celery" -A backend beat -l info \
      --pidfile="$CELERY_BEAT_PID_FILE" \
      --schedule="$CELERY_BEAT_SCHEDULE_FILE" \
      --logfile="$BASE_DIR/celery-9202-beat.log" \
      --detach
    echo "Celery beat started (schedule file: $CELERY_BEAT_SCHEDULE_FILE)"
  fi
}

start_backend
start_submit_backend
if [[ "$ENABLE_CELERY" =~ ^(1|true|yes|on)$ ]]; then
  start_celery
else
  echo "Celery disabled (ENABLE_CELERY=$ENABLE_CELERY); skipping Celery workers and beat"
fi
