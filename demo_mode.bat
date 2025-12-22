@echo off
echo ========================================
echo   DEMO MODE - Hardcoded OTP: 999999
echo ========================================
echo.
scp main.py root@172.105.60.198:/root/Polyclinic/main.py
ssh root@172.105.60.198 "pkill -9 python; pkill -9 gunicorn; pkill -9 uvicorn; sleep 2"
ssh root@172.105.60.198 "cd /root/Polyclinic && source venv/bin/activate && gunicorn -k uvicorn.workers.UvicornWorker --daemon --bind 0.0.0.0:80 --access-logfile server.log --error-logfile server.log --capture-output main:app"
echo.
echo ========================================
echo   OTP is now HARDCODED to: 999999
echo ========================================
echo.
echo For your presentation:
echo 1. Enter any email
echo 2. Click "Send Verification Code"
echo 3. Enter code: 999999
echo 4. Booking will complete!
echo.
pause
