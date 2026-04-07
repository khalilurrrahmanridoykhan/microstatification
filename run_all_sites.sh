#!/bin/bash
set -euo pipefail

SERVICES=(
  "commicplan-gunicorn.service"
  "commicplanv2.service"
  "nginx"
)

log_section() {
  echo
  echo "============================================================"
  echo "== $1"
  echo "============================================================"
}

log_section "ComMicPlan site recovery"
echo "This script restarts the core services needed for dev/admin API/frontends."
echo "Run with a sudo-capable account (you will be prompted if sudo needs a password)."

for svc in "${SERVICES[@]}"; do
  log_section "Restarting $svc"
  sudo systemctl restart "$svc"
  sudo systemctl --no-pager --lines 5 status "$svc"
done

log_section "Listening ports snapshot"
sudo ss -tlnp | grep -E "(:80|:443|:8000|:9090)" || true

log_section "Tail of gunicorn log"
sudo journalctl -u commicplan-gunicorn.service -n 20 --no-pager || true

log_section "Next steps"
echo "1. Verify https://dev.commicplan.com/ and https://admin2.commicplan.com/ in a browser."
echo "2. If EWARS LMIS proxying is required, re-enable the /lmis/ block in /etc/nginx/sites-available/ewars.commicplan.com before rerunning."
echo "3. Use this script whenever a reboot or outage happens; it will restart nginx plus the two Gunicorn units."
