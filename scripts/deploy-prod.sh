#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/../.env"

: "${DROPLET_USER:?DROPLET_USER is not set in .env}"
: "${DROPLET_IP:?DROPLET_IP is not set in .env}"
: "${APP_DIR:?APP_DIR is not set in .env}"
: "${PM2_PROCESS_NAME:?PM2_PROCESS_NAME is not set in .env}"

echo "Connecting to ${DROPLET_USER}@${DROPLET_IP}..."
ssh "${DROPLET_USER}@${DROPLET_IP}" << EOF
  set -e
  cd ${APP_DIR}

  echo "Pulling latest changes..."
  git pull

  echo "Installing dependencies..."
  npm install

  echo "Deploying slash commands..."
  npm run deploy

  echo "Restarting bot..."
  pm2 restart ${PM2_PROCESS_NAME}

  echo "Done! Current status:"
  pm2 status ${PM2_PROCESS_NAME}
EOF
