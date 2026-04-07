#!/bin/sh
set -e

: "${DB_HOST:=localhost}"
: "${DB_PORT:=5432}"

if [ "${SKIP_DB_WAIT:-}" != "1" ]; then
  echo "Waiting for database ${DB_HOST}:${DB_PORT}..."
  python - <<'PY'
import os
import sys
import time

import psycopg2

db_name = os.getenv("DB_NAME") or os.getenv("POSTGRES_DB") or "mydatabase"
db_user = os.getenv("DB_USER") or os.getenv("POSTGRES_USER") or "ridoy"
db_password = os.getenv("DB_PASSWORD") or os.getenv("POSTGRES_PASSWORD") or "654321"
db_host = os.getenv("DB_HOST", "localhost")
db_port = int(os.getenv("DB_PORT", "5432"))

for attempt in range(60):
    try:
        conn = psycopg2.connect(
            dbname=db_name,
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port,
        )
        conn.close()
        print("Database is available.")
        sys.exit(0)
    except Exception as exc:
        print(f"Database not ready ({attempt + 1}/60): {exc}")
        time.sleep(1)

print("Database not ready after 60 seconds.")
sys.exit(1)
PY
fi

mkdir -p /app/static /app/media /app/staticfiles

if [ "${SKIP_MIGRATIONS:-}" != "1" ]; then
  python manage.py migrate --noinput
fi

if [ "${SKIP_COLLECTSTATIC:-}" != "1" ]; then
  python manage.py collectstatic --noinput
fi

exec "$@"
