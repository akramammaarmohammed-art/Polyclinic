@echo off
echo ========================================================
echo   GET OTP CODE (Server Logs)
echo ========================================================
echo.
set /p SERVER_IP="Enter your Server IP Address: "
if "%SERVER_IP%"=="" goto error

echo.
echo Connecting to %SERVER_IP%...
echo Searching logs for "MOCK EMAIL"...
echo.

ssh root@%SERVER_IP% "cd Polyclinic; grep 'MOCK EMAIL' server.log | tail -n 5"

echo.
echo ========================================================
echo   (If blank, click 'Send OTP' on the website first!)
echo ========================================================
pause
exit

:error
echo IP missing.
pause
