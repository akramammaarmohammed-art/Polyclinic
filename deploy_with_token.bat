@echo off
echo ========================================================
echo   DEPLOY PRIVATE REPOSITORY
echo ========================================================
echo.
echo To download a Private Repo, we need a "Personal Access Token".
echo.
echo 1. Go to https://github.com/settings/tokens
echo 2. Generate a new token (Classic).
echo 3. Scope: Tick the 'repo' box.
echo 4. Copy the long token (starts with ghp_...)
echo.
set /p GIT_TOKEN="Paste your Token here: "

if "%GIT_TOKEN%"=="" goto error

echo.
set /p SERVER_IP="Enter your Server IP Address: "
if "%SERVER_IP%"=="" goto error

echo.
echo Connecting to %SERVER_IP%...
echo (Type password if asked)
echo.

:: Construct the URL AUTH format: https://USER:TOKEN@github.com/...
set GIT_AUTH_URL=https://akramammaarmohammed-art:%GIT_TOKEN%@github.com/akramammaarmohammed-art/Polyclinic.git

:: Run the NUCLEAR update with the AUTH URL
ssh root@%SERVER_IP% "echo 'Deleting old folder...'; rm -rf Polyclinic; echo 'Cloning Private Repo...'; git clone %GIT_AUTH_URL% Polyclinic; cd Polyclinic; echo 'setting secrets...'; echo EMAIL_USER=polyclinic977@gmail.com > .env; echo EMAIL_PASS=uxck ydkc gxge zzhm >> .env; echo SECRET_KEY=remote_deploy_key >> .env; chmod +x server_update.sh; echo 'Starting server...'; ./server_update.sh"

echo.
echo ========================================================
echo   DONE!
echo ========================================================
pause
exit

:error
echo Error: Missing Token or IP.
pause
