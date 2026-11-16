#!/usr/bin/env bash
# Manual update script for the EC2 server (Stage 1). Run it on the server from anywhere:
#   bash deploy/scripts/deploy.sh
#
# What it does: pull latest code -> install deps -> build frontend -> publish to Nginx's web
# root -> reload the API with PM2 -> run a health check.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/taskflow}"

echo "==> Pulling latest code"
git -C "$REPO_DIR" pull --ff-only

echo "==> Installing backend dependencies (production only)"
(cd "$REPO_DIR/backend" && npm ci --omit=dev)

echo "==> Building frontend"
(cd "$REPO_DIR/frontend" && npm ci && npm run build)

echo "==> Publishing frontend to $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete "$REPO_DIR/frontend/dist/" "$WEB_ROOT/"

echo "==> Reloading API with PM2"
pm2 startOrReload "$REPO_DIR/deploy/pm2/ecosystem.config.cjs" --update-env
pm2 save

echo "==> Verifying deployment"
bash "$REPO_DIR/deploy/scripts/smoke.sh"

echo "Deployment finished."
