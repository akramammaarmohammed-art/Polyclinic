@echo off
set /p phone="Enter your phone number (e.g. +12223334444): "
echo Sending Test SMS to %phone%...
echo.
ssh root@172.105.60.198 "cd Polyclinic && source venv/bin/activate && python3 -c 'from voice_service import send_sms_otp; res=send_sms_otp(\"%phone%\", \"TEST-123\"); print(\"RESULT:\", res)'"
echo.
echo If it says "RESULT: True", the SMS was sent.
echo If it says "RESULT: False", then Twilio credentials are rejected.
pause
