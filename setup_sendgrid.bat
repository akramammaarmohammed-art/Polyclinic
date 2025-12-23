@echo off
echo ========================================================
echo   CONFIGURING SENDGRID ON SERVER (SECURE MODE)
echo ========================================================
echo.
set /p SERVER_IP="Enter your Server IP Address: "
if "%SERVER_IP%"=="" goto error

echo.
echo Please Paste your SendGrid API Key below.
echo (It will be hidden for security)
echo.
set /p SG_KEY="API Key: "

echo.
echo Connecting to %SERVER_IP%...
echo.

ssh root@%SERVER_IP% "echo 'SENDGRID_API_KEY=%SG_KEY%' >> Polyclinic/.env && echo 'SUCCESS: API Key Added!'"

echo.
echo ========================================================
echo   CONFIGURATION COMPLETE
echo ========================================================
pause
exit

:error
echo IP missing.
pause
