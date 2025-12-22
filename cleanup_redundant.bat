@echo off
echo ========================================
echo   CLEANING PROJECT FOLDER
echo ========================================
echo.
echo Deleting redundant files...
echo.

del /Q *.bak
del /Q deploy_*.bat
del /Q check_*.bat
del /Q check_*.py
del /Q debug_*.py
del /Q test_*.py
del /Q verify_*.py
del /Q upgrade_*.py
del /Q restore_*.bat
del /Q run_*.bat
del /Q fix_*.py
del /Q fix_*.bat
del /Q seed_*.py
del /Q direct_upload.bat
del /Q emergency_fix.bat
del /Q manual_deploy.bat
del /Q nuclear_restart.bat
del /Q quick_deploy.bat
del /Q quick_logs.bat
del /Q update_server.bat
del /Q zip_project.py
del /Q voice_otp.py
del /Q voice_service.py
del /Q verify.py
del /Q list_doctors.py
del /Q install_and_start.bat
del /Q just_backend.bat
del /Q diagnose_startup.bat
del /Q diagnose_startup_asgi.bat
del /Q add_email_column.py
del /Q add_phone_column.py
del /Q get_logs.bat
del /Q *.zip
del /Q ngrok_output.txt
del /Q local_server.log
del /Q server.log

echo.
echo Check completed. Redundant files removed.
echo ========================================
pause
