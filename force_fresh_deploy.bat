@echo off
echo ========================================
echo   CACHE-BUSTING DEPLOYMENT
echo ========================================
echo.

echo [1/7] Checking if voice_otp.py exists on server...
ssh root@172.105.60.198 "ls -lh /root/Polyclinic/voice_otp.py || echo 'FILE MISSING!'"

echo.
echo [2/7] Deleting ALL Python cache (.pyc files)...
ssh root@172.105.60.198 "find /root/Polyclinic -name '*.pyc' -delete"
ssh root@172.105.60.198 "find /root/Polyclinic -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null || true"

echo.
echo [3/7] Re-uploading voice_otp.py...
scp voice_otp.py root@172.105.60.198:/root/Polyclinic/voice_otp.py

echo.
echo [4/7] Re-uploading main.py...
scp main.py root@172.105.60.198:/root/Polyclinic/main.py

echo.
echo [5/7] Verifying files uploaded...
ssh root@172.105.60.198 "grep -c 'make_voice_call' /root/Polyclinic/main.py && grep -c 'def make_voice_call' /root/Polyclinic/voice_otp.py"

echo.
echo [6/7] KILLING everything with -9...
ssh root@172.105.60.198 "pkill -9 python; pkill -9 gunicorn; pkill -9 uvicorn; sleep 5"

echo.
echo [7/7] Starting server (NO daemon to see errors)...
ssh root@172.105.60.198 "cd /root/Polyclinic && source venv/bin/activate && export PYTHONUNBUFFERED=1 && gunicorn -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:80 --access-logfile - --error-logfile - main:app 2>&1 &"

echo.
echo ========================================
echo   Server started in FOREGROUND mode
echo   Watch for startup errors above
echo ========================================
echo.
echo Now try the website!
pause
