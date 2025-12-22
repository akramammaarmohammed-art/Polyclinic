@echo off
echo --- FORCE CLEAN RESTART (WITH LOGGING) ---
echo 1. Killing ALL existing servers...
ssh root@172.105.60.198 "pkill -f gunicorn || true && pkill -f uvicorn || true && pkill -f python || true"

echo 2. Starting Server Correctly...
echo (Logging output to server.log so we can see the Code)
echo.
ssh root@172.105.60.198 "cd Polyclinic && source venv/bin/activate && export PYTHONUNBUFFERED=1 && gunicorn -k uvicorn.workers.UvicornWorker --daemon --access-logfile server.log --error-logfile server.log --capture-output main:app --bind 0.0.0.0:80"
echo.
echo Server Restarted. Please try the Booking again.
pause
