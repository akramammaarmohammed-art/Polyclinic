@echo off
echo ========================================
echo   CREATING PROJECT BACKUP
echo ========================================
echo.
echo Source: %CD%
cd ..
set "BACKUP_DIR=Polyclinic_BACKUP_V2"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo Destination: %CD%\%BACKUP_DIR%
echo.
echo Copying files... (This may take a minute)
echo.
robocopy "Polyclinic" "%BACKUP_DIR%" /E /XD venv .git __pycache__ /XF *.pyc /R:2 /W:2

echo.
echo ========================================
echo   BACKUP COMPLETE
echo ========================================
echo Saved to: %CD%\%BACKUP_DIR%
pause
