#!/bin/bash
set -e

DROPLET_USER="root"
DROPLET_IP="your-droplet-ip"
APP_DIR="/home/alfred/Alfredv2"

echo "Connecting to droplet..."
ssh "${DROPLET_USER}@${DROPLET_IP}" << 'EOF'
  set -e
  cd /home/alfred/Alfredv2

  echo "Pulling latest changes..."
  git pull

  echo "Installing dependencies..."
  npm install

  echo "Deploying slash commands..."
  npm run deploy

  echo "Restarting bot..."
  pm2 restart alfred

  echo "Done! Current status:"
  pm2 status alfred
EOF
