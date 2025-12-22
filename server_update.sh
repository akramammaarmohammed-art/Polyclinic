#!/bin/bash
set -e

# Configuration
APP_DIR="/root/Polyclinic"
SERVICE_NAME="polyclinic"  # If using systemd

echo "========================================"
echo "   UPDATING POLYCLINIC FROM GITHUB"
echo "========================================"

# 1. Pull latest changes
echo "[1/3] Pulling changes from GitHub..."
cd $APP_DIR
git fetch --all
git reset --hard origin/main
git pull origin main

# 2. Update Dependencies (if changed)
echo "[2/3] Checking dependencies..."
source venv/bin/activate
pip install -r requirements.txt

# 3. Restart Application
echo "[3/3] Restarting Server..."

# Check if running via systemd or screen/nohup
if pgrep -f "gunicorn" > /dev/null; then
    echo "Restarting Gunicorn..."
    pkill -f "gunicorn"
    nohup gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:80 > server.log 2>&1 &
else
    echo "Gunicorn was not running. Starting it..."
    nohup gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:80 > server.log 2>&1 &
fi

echo "========================================"
echo "   UPDATE COMPLETE"
echo "========================================"
