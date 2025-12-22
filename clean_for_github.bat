@echo off
echo ========================================
echo   PREPARING FOR GITHUB (Removing Secrets)
echo ========================================
echo.
echo WARNING: This will remove the hardcoded password from main.py
echo so it is safe to upload.
echo.
echo You MUST rely on .env file locally after this.
echo.

python -c "content = open('main.py', 'r', encoding='utf-8').read().replace('EMAIL_PASSWORD = \"uxck ydkc gxge zzhm\"', 'EMAIL_PASSWORD = os.getenv(\"EMAIL_PASS\")').replace('EMAIL_SENDER = \"polyclinic977@gmail.com\"', 'EMAIL_SENDER = os.getenv(\"EMAIL_USER\")'); open('main.py', 'w', encoding='utf-8').write(content)"

echo Sanitization Complete.
echo You can now git add/commit/push safely.
pause
