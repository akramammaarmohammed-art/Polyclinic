@echo off
echo ========================================================
echo   SERVER HEALTH CHECK
echo ========================================================
echo.
set /p SERVER_IP="Enter your Server IP Address: "
if "%SERVER_IP%"=="" goto error

echo.
echo Connecting to %SERVER_IP%...
echo (Type password if asked)
echo.

ssh root@%SERVER_IP% "cd Polyclinic; echo '--- PROCESS STATUS ---'; pgrep -a gunicorn; echo '--- LISTENING PORTS ---'; netstat -tulpn | grep :80; echo '--- LAST LOGS ---'; tail -n 50 server.log"

echo.
echo ========================================================
echo   CHECK COMPLETE
echo ========================================================
pause
exit

:error
echo IP missing.
pause
