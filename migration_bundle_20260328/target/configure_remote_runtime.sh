#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/var/www/ComMicPlanV2_clone_2_Mar"
TARGET_IP="72.61.170.115"
ENKETO_DIR="/opt/enketo/packages/enketo-express"

cp -a "$PROJECT_DIR/.env" "$PROJECT_DIR/.env.bak.pre_target"
cp -a "$PROJECT_DIR/frontend/.env" "$PROJECT_DIR/frontend/.env.bak.pre_target"
cp -a "$PROJECT_DIR/frontend/.env.development" "$PROJECT_DIR/frontend/.env.development.bak.pre_target"
cp -a "$PROJECT_DIR/frontend/.env.production.nmcp" "$PROJECT_DIR/frontend/.env.production.nmcp.bak.pre_target"

sed -i \
  -e "s#^ENKETO_URL=.*#ENKETO_URL=http://$TARGET_IP:8005#" \
  -e "s#^FRONTEND_URL=.*#FRONTEND_URL=http://$TARGET_IP:9200#" \
  -e "s#^ENKETO_ALLOWED_ORIGINS=.*#ENKETO_ALLOWED_ORIGINS=http://$TARGET_IP:9200,http://$TARGET_IP:8005,http://127.0.0.1:9200,http://localhost:9200#" \
  -e "s#^ALLOWED_HOSTS=.*#ALLOWED_HOSTS=127.0.0.1,localhost,$TARGET_IP#" \
  -e "s#^CSRF_TRUSTED_ORIGINS=.*#CSRF_TRUSTED_ORIGINS=http://$TARGET_IP:9200,http://$TARGET_IP:8005,http://127.0.0.1:9200,http://localhost:9200#" \
  -e "s#^OPENROSA_SERVER_URL=.*#OPENROSA_SERVER_URL=http://$TARGET_IP:9200/api/openrosa#" \
  "$PROJECT_DIR/.env"

for frontend_env in \
  "$PROJECT_DIR/frontend/.env" \
  "$PROJECT_DIR/frontend/.env.development" \
  "$PROJECT_DIR/frontend/.env.production.nmcp"
do
  sed -i \
    -e "s#^VITE_BACKEND_URL=.*#VITE_BACKEND_URL=http://$TARGET_IP:9200#" \
    -e "s#^VITE_ENKETO_URL=.*#VITE_ENKETO_URL=http://$TARGET_IP:8005#" \
    -e "s#^VITE_OPENROSA_SERVER_URL=.*#VITE_OPENROSA_SERVER_URL=http://$TARGET_IP:9200/api/openrosa#" \
    "$frontend_env"
done

rm -rf "$ENKETO_DIR"
mkdir -p "$(dirname "$ENKETO_DIR")"
tar -C "$(dirname "$ENKETO_DIR")" \
  -xzf "$PROJECT_DIR/migration_bundle_20260328/config/enketo-express_20260328.tar.gz"

cat > "$ENKETO_DIR/.env" <<EOF
NODE_ENV=production
PORT=8005

ENKETO_BASE_URL=http://$TARGET_IP:8005
ENKETO_API_URL=http://$TARGET_IP:9200
ENKETO_EMBED_URL=http://$TARGET_IP:8005/::id
ENKETO_API_SUBMISSION_URL=http://$TARGET_IP:9200/api/openrosa/submission

ENKETO_LINKED_FORM_AND_DATA_SERVER_NAME=ComMicPlanV2 Clone OpenRosa
ENKETO_LINKED_FORM_AND_DATA_SERVER_SERVER_URL=http://$TARGET_IP:9200/api/openrosa
ENKETO_LINKED_FORM_AND_DATA_SERVER_LEGACY_FORMHUB=false
ENKETO_LINKED_FORM_AND_DATA_SERVER_AUTHENTICATION_TYPE=cookie
ENKETO_LINKED_FORM_AND_DATA_SERVER_AUTHENTICATION_URL=http://$TARGET_IP:9200/auth/enketo-login?return={RETURNURL}
ENKETO_LINKED_FORM_AND_DATA_SERVER_API_KEY=9f8c2e4b7a1d4e8

ENKETO_ENCRYPTION_KEY=9IayZpXg0vevx9BbwIcoj8D6K7LN6HqHpsowM2GfuwQ
ENKETO_LESS_SECURE_ENCRYPTION_KEY=txCWDeEws5Wk-AU58DW-EYQV9fD02K7O

ENKETO_CORS_ALLOWED_ORIGINS_0=http://$TARGET_IP:9200
ENKETO_CORS_ALLOWED_ORIGINS_1=http://127.0.0.1:9200
ENKETO_CORS_ALLOWED_ORIGINS_2=http://localhost:9200

ENKETO_OFFLINE_SURVEYS=true
OPENROSA_VERSION=1.0
ENKETO_SUPPORT_EMAIL=support@example.org
ENKETO_DEFAULT_THEME=kobo
ENKETO_QUERY_PARAMETER_TO_PASS_TO_SUBMISSION=form_id

ENKETO_REDIS_MAIN_URL=redis://127.0.0.1:6379/11
ENKETO_REDIS_CACHE_URL=redis://127.0.0.1:6379/12
EOF

cat > "$ENKETO_DIR/config.json" <<EOF
{
  "redis": {
    "main": {
      "host": "127.0.0.1",
      "port": 6379
    }
  },
  "trust proxy": true,
  "base url": "http://$TARGET_IP:8005"
}
EOF

cat > /etc/systemd/system/enketo-clone.service <<EOF
[Unit]
Description=ComMicPlan clone Enketo
After=network.target redis-server.service
Requires=redis-server.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=$ENKETO_DIR
Environment=PATH=/usr/bin:/usr/local/bin
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

ufw allow 9200/tcp >/dev/null 2>&1 || true
ufw allow 8005/tcp >/dev/null 2>&1 || true

chmod +x "$PROJECT_DIR/start_clone_stack.sh"
chmod +x "$PROJECT_DIR/migration_bundle_20260328/target/setup_target.sh"

echo "Remote runtime configuration updated for $TARGET_IP"
