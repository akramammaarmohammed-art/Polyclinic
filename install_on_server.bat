@echo off
echo ========================================================
echo   INSTALL ON SERVER (VIA POWERSHELL/SSH)
echo ========================================================
echo.
echo This script will log into your server and set everything up.
echo You will need to type your server password.
echo.
set /p SERVER_IP="Enter your Server IP Address: "

if "%SERVER_IP%"=="" goto error

echo.
echo Connecting to %SERVER_IP%...
echo (If asked, type 'yes' to accept the fingerprint, then your password)
echo.

ssh root@%SERVER_IP% "git clone https://github.com/akramammaarmohammed-art/Polyclinic.git; cd Polyclinic; echo EMAIL_USER=polyclinic977@gmail.com > .env; echo EMAIL_PASS=uxck ydkc gxge zzhm >> .env; echo SECRET_KEY=remote_deploy_key >> .env; chmod +x server_update.sh; ./server_update.sh"

echo.
echo ========================================================
echo   DONE! Server should be running.
echo ========================================================
pause
exit

:error
echo Error: IP Address required.
pause
