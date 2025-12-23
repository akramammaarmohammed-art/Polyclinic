@echo off
echo ========================================================
echo   DEBUG STARTUP CRASH
echo ========================================================
echo.
set /p SERVER_IP="Enter your Server IP Address: "
if "%SERVER_IP%"=="" goto error

echo.
echo Connecting to %SERVER_IP%...
echo We are going to try running the app MANUALLY to see the error.
echo.

ssh root@%SERVER_IP% "cd Polyclinic; echo '--- PYTHON IMPORT TEST ---'; ./venv/bin/python -c 'from main import app; print(\"SUCCESS: App imported\")' 2>&1"

echo.
echo ========================================================
echo   If you see "ModuleNotFoundError", that is the problem.
echo ========================================================
pause
exit

:error
echo IP missing.
pause
