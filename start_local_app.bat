@echo off
echo ========================================
echo   STARTING LOCAL POLYCLINIC SERVER
echo ========================================
echo.
echo This runs the app on your computer.
echo It will use your LOCAL internet (bypassing the cloud block).
echo.
echo Address: http://localhost:8000
echo.

IF NOT EXIST "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [INFO] Installing requirements...
    pip install -r requirements.txt
) ELSE (
    call venv\Scripts\activate.bat
)
uvicorn main:app --reload --port 8000 > local_server.log 2>&1
pause
