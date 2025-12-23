@echo off
echo ========================================================
echo   INSTALL ON SERVER (Fresh Install)
echo ========================================================
echo.
echo The folder on the server is corrupted (not a git repo).
echo I will DELETE it and re-download everything fresh.
echo.
set /p SERVER_IP="Enter your Server IP Address: "

if "%SERVER_IP%"=="" goto error

echo.
echo Connecting to %SERVER_IP%...
echo (Type password if asked)
echo.

:: NUCLEAR OPTION: rm -rf Polyclinic then clone
ssh root@%SERVER_IP% "echo 'Deleting old folder...'; rm -rf Polyclinic; echo 'Cloning fresh copy...'; git clone https://github.com/akramammaarmohammed-art/Polyclinic.git; cd Polyclinic; echo 'setting secrets...'; echo EMAIL_USER=polyclinic977@gmail.com > .env; echo EMAIL_PASS=uxck ydkc gxge zzhm >> .env; echo SECRET_KEY=remote_deploy_key >> .env; chmod +x server_update.sh; echo 'Starting server...'; ./server_update.sh"

echo.
echo ========================================================
echo   DONE! Server should be running.
echo ========================================================
pause
exit

:error
echo Error: IP Address required.
pause
