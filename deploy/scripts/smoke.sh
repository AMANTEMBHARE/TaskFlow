#!/usr/bin/env bash
# Basic post-deployment verification. Run on the server:  bash deploy/scripts/smoke.sh
# Checks the API directly (port 5000, local only) and through Nginx (port 80).
set -uo pipefail

API_URL="${API_URL:-http://127.0.0.1:5000/api/v1/health}"
NGINX_URL="${NGINX_URL:-http://127.0.0.1/api/v1/health}"
SITE_URL="${SITE_URL:-http://127.0.0.1/}"

check() {
  local name="$1" url="$2" attempts=10
  for ((i = 1; i <= attempts; i++)); do
    if curl -fsS --max-time 5 "$url" > /dev/null 2>&1; then
      echo "OK    $name ($url)"
      return 0
    fi
    sleep 2
  done
  echo "FAIL  $name ($url)"
  return 1
}

status=0
check "API health (direct)"        "$API_URL"   || status=1
check "API health (through Nginx)" "$NGINX_URL" || status=1
check "Frontend index.html"        "$SITE_URL"  || status=1

if [ "$status" -ne 0 ]; then
  echo "Smoke check failed. See: pm2 logs taskflow-api   |   sudo tail -n 50 /var/log/nginx/error.log"
fi
exit "$status"
