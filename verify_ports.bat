@echo off
echo ========================================
echo   TESTING PORT CONNECTIVITY
echo ========================================
echo.
echo Trying to connect to smtp.gmail.com on Port 465 (SSL)...
ssh root@172.105.60.198 "python3 -c \"import socket; s = socket.create_connection(('smtp.gmail.com', 465), timeout=5); print('SUCCESS: Connected to Port 465')\""
if %ERRORLEVEL% NEQ 0 echo FAILED: Connection to Port 465 Timed Out (BLOCKED)

echo.
echo Trying to connect to smtp.gmail.com on Port 587 (TLS)...
ssh root@172.105.60.198 "python3 -c \"import socket; s = socket.create_connection(('smtp.gmail.com', 587), timeout=5); print('SUCCESS: Connected to Port 587')\""
if %ERRORLEVEL% NEQ 0 echo FAILED: Connection to Port 587 Timed Out (BLOCKED)

echo.
echo ========================================
echo Analysis:
echo If you see "FAILED" above, your server provider is blocking these ports.
echo You MUST ask them to unblock them.
pause
