#!/usr/bin/env bash
set -euo pipefail

ENKETO_DIR="/opt/enketo/packages/enketo-express"

if [[ ! -d "$ENKETO_DIR" ]]; then
  echo "Missing Enketo runtime directory: $ENKETO_DIR" >&2
  exit 1
fi

su -s /bin/bash www-data -c "
  set -euo pipefail
  cd '$ENKETO_DIR'
  if pm2 describe enketo >/dev/null 2>&1; then
    PORT=8005 pm2 restart enketo --update-env
  else
    PORT=8005 pm2 start app.js --name enketo --update-env --time
  fi
  pm2 save
"
systemctl enable pm2-www-data >/dev/null 2>&1 || true
systemctl restart pm2-www-data >/dev/null 2>&1 || true

echo "Enketo PM2 start command finished."
