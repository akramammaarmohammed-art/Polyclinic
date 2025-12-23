@echo off
echo ========================================================
echo   DIAGNOSE CRASH
echo ========================================================
echo.
set /p SERVER_IP="Enter your Server IP Address: "
if "%SERVER_IP%"=="" goto error

echo.
echo Connecting to %SERVER_IP%...
echo.

ssh root@%SERVER_IP% "cd Polyclinic; echo '[1] IS IT RUNNING?'; pgrep -a gunicorn; echo '[2] LISTENING PORTS (SS)'; ss -tuln | grep 80; echo '[3] CRASH LOGS'; tail -n 30 server.log"

echo.
echo ========================================================
echo   DIAGNOSIS COMPLETE
echo ========================================================
pause
exit

:error
echo IP missing.
pause
