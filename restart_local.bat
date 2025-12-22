@echo off
echo ========================================
echo   RESTARTING LOCAL SERVER (CLEAN)
echo ========================================
echo.
echo 1. Killing old processes...
taskkill /F /IM uvicorn.exe /T 2>nul
taskkill /F /IM python.exe /T 2>nul

echo.
echo 2. Starting fresh server...
echo.
call venv\Scripts\activate.bat
echo Logs are being written to local_server.log...
start uvicorn main:app --reload --port 8000 > local_server.log 2>&1
echo.
echo Server Started!
echo Please check Ngrok window is still running.
pause
