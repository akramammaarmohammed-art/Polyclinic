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
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "Upgrade pip..."
    source venv/bin/activate
    pip install --upgrade pip
else
    source venv/bin/activate
fi
pip install -r requirements.txt

# 3. Restart Application
echo "[3/3] Restarting Server (Public Port 80)..."

# Kill existing process
pkill gunicorn || true
sleep 2

# Bind to 0.0.0.0:80 (Direct Access)
nohup ./venv/bin/gunicorn main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:80 > server.log 2>&1 &

echo "Waiting 5 seconds for startup verification..."
sleep 5

if pgrep -f "gunicorn" > /dev/null; then
    echo "✅ SUCCESS: App is running on Port 80!"
else
    echo "❌ FAILURE: Server CRASHED immediately!"
    echo "--- LAST 20 LINES OF ERROR LOG ---"
    tail -n 20 server.log
    echo "----------------------------------"
fi

echo "========================================"
echo "   UPDATE COMPLETE"
echo "========================================"
