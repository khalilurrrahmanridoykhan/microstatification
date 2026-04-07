#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/var/www/ComMicPlanV2_clone_2_Mar"
DB_NAME="commicplan_clone_2_Mar"
DB_USER="ridoy"
DB_PASSWORD="654321"
DB_DUMP="$PROJECT_DIR/migration_bundle_20260328/db/commicplan_clone_2_Mar_20260328.dump"

if [[ ! -f "$DB_DUMP" ]]; then
  echo "Missing database dump: $DB_DUMP" >&2
  exit 1
fi

install -d -m 0755 "$PROJECT_DIR"

systemctl enable --now postgresql redis-server >/dev/null 2>&1 || true

if ! id -u www-data >/dev/null 2>&1; then
  echo "www-data user is required" >&2
  exit 1
fi

runuser -u postgres -- psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
  runuser -u postgres -- psql -c "CREATE ROLE $DB_USER WITH LOGIN PASSWORD '$DB_PASSWORD';"
runuser -u postgres -- psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  runuser -u postgres -- createdb -O "$DB_USER" "$DB_NAME"

runuser -u postgres -- pg_restore --clean --if-exists --no-owner --role="$DB_USER" -d "$DB_NAME" "$DB_DUMP"

python3 -m venv "$PROJECT_DIR/.venv"
"$PROJECT_DIR/.venv/bin/pip" install --upgrade pip setuptools wheel
"$PROJECT_DIR/.venv/bin/pip" install -r "$PROJECT_DIR/backend/requirements.txt"

pushd "$PROJECT_DIR/frontend" >/dev/null
npm install
npm run build
popd >/dev/null

pushd "$PROJECT_DIR/backend" >/dev/null
set -a
. "$PROJECT_DIR/.env"
set +a
"$PROJECT_DIR/.venv/bin/python" manage.py migrate --noinput
"$PROJECT_DIR/.venv/bin/python" manage.py collectstatic --noinput
popd >/dev/null

chown -R www-data:www-data "$PROJECT_DIR"

echo "Target setup finished."
