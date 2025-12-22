#!/bin/bash
set -e

# Configuration
APP_DIR="/root/Polyclinic"
VENV_DIR="$APP_DIR/venv"
PORT=80

echo "--- Starting Polyclinic Deployment ---"

# 1. Update System
echo "[1/5] Updating System Packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y python3 python3-pip python3-venv git

# 2. Setup App Directory
# Assumes files are already copied here, but ensures venv exists
echo "[2/5] Setting up Virtual Environment..."
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv $VENV_DIR
    echo "Virtual environment created."
fi

# 3. Install Dependencies
echo "[3/5] Installing Python Dependencies..."
source $VENV_DIR/bin/activate
pip install --upgrade pip
if [ -f "$APP_DIR/requirements.txt" ]; then
    pip install -r $APP_DIR/requirements.txt
else
    echo "WARNING: requirements.txt not found!"
fi

# Install Gunicorn for production
pip install gunicorn

# 4. Check Environment
echo "[4/5] Checking Configuration..."
if [ ! -f "$APP_DIR/.env" ]; then
    echo "Creating default .env (PLEASE EDIT THIS)..."
    echo "SECRET_KEY=$(openssl rand -hex 32)" > $APP_DIR/.env
    echo "Created .env with random secret key."
fi

# 5. Run Server (Simple Mode with Nohup)
# For a robust system, use systemd (see DEPLOY.md)
echo "[5/5] Launching Server..."
# Kill existing instance if any
pkill -f "uvicorn" || true

# Run with Gunicorn using Uvicorn workers
# Binding to 0.0.0.0:80 requires Root
nohup gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT > server.log 2>&1 &

echo "-----------------------------------"
echo "Deployment Complete!"
echo "Server is running on port $PORT."
echo "Logs: tail -f server.log"
echo "-----------------------------------"
