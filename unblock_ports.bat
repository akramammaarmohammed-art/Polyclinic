@echo off
echo ========================================================
echo   UNBLOCK EMAIL PORTS (Linux Firewall)
echo ========================================================
echo.
set /p SERVER_IP="Enter your Server IP Address: "
if "%SERVER_IP%"=="" goto error

echo.
echo Connecting to %SERVER_IP%...
echo Attempting to unblock Outbound Email Ports...
echo.

:: We allow OUT for sending emails, and IN just in case.
ssh root@%SERVER_IP% "echo '--- CONFIGURING FIREWALL ---'; ufw allow out 587/tcp; ufw allow out 465/tcp; ufw allow out 2525/tcp; ufw allow 587/tcp; ufw allow 465/tcp; ufw allow 2525/tcp; ufw reload; echo '--- FIREWALL STATUS ---'; ufw status verbose"

echo.
echo ========================================================
echo   DONE.
echo   If it still fails, the BLOCK is by your Cloud Provider (Linode/AWS),
echo   not the server itself.
echo ========================================================
pause
exit

:error
echo IP missing.
pause
