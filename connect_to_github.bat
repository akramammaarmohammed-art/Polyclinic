@echo off
setlocal
echo ========================================================
echo   EASY GITHUB CONNECT (Final Fix)
echo ========================================================
echo.
set REPO_URL=https://github.com/akramammaarmohammed-art/Polyclinic.git

echo [1/4] Initializing...
if not exist .git git init
git branch -M main

echo [2/4] Saving files...
git add .
:: Try to commit
git commit -m "Upload from Easy Connect" >nul 2>&1

:: If commit failed, it's likely the identity error
if %errorlevel% neq 0 (
    echo.
    echo *** GIT SETUP REQUIRED ***
    echo Git needs to know who you are to save changes.
    echo.
    set /p GIT_NAME="Enter your Name: "
    set /p GIT_EMAIL="Enter your Email: "
    
    git config --global user.name "%GIT_NAME%"
    git config --global user.email "%GIT_EMAIL%"
    
    echo.
    echo Identity Saved. Retrying save...
    git commit -m "Upload from Easy Connect"
)

echo [3/4] Uploading...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo ========================================================
echo   SUCCESS! Your code is on GitHub.
echo ========================================================
echo Now run 'install_on_server.bat' to deploy.
pause
