#!/usr/bin/env bash
set -euo pipefail

PID_FILE="/tmp/commicplan_clone2_9202.pid"
SUBMIT_PID_FILE="/tmp/commicplan_clone2_submit_9212.pid"
LEGACY_CELERY_PID_FILE="/tmp/commicplan_clone2_celery.pid"
CELERY_GENERAL_PID_FILE="/tmp/commicplan_clone2_celery_general.pid"
CELERY_SUBMIT_PID_FILE="/tmp/commicplan_clone2_celery_submit.pid"
CELERY_BEAT_PID_FILE="/tmp/commicplan_clone2_celery_beat.pid"

stop_pid_file() {
  local pid_file="$1"
  local name="$2"
  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    kill "$(cat "$pid_file")" || true
    rm -f "$pid_file"
    echo "Stopped $name"
  else
    echo "$name not running"
  fi
}

stop_pid_file "$PID_FILE" "backend"
stop_pid_file "$SUBMIT_PID_FILE" "submit backend"
stop_pid_file "$LEGACY_CELERY_PID_FILE" "legacy celery worker"
stop_pid_file "$CELERY_GENERAL_PID_FILE" "general celery worker"
stop_pid_file "$CELERY_SUBMIT_PID_FILE" "submit celery worker"
stop_pid_file "$CELERY_BEAT_PID_FILE" "celery beat"
