@echo off
setlocal
echo ========================================================
echo   EASY GITHUB CONNECT
echo ========================================================
echo.
set REPO_URL=https://github.com/akramammaarmohammed-art/Polyclinic.git

echo [1/4] Initializing...
if not exist .git git init
git branch -M main

echo [2/4] Saving files...
git add .

:: CONFIG CHECK
git config user.email >nul 2>&1
if %errorlevel% neq 0 (
    goto get_identity
)

:commit_files
git commit -m "Upload from Easy Connect" >nul 2>&1

echo [3/4] Uploading...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo ========================================================
echo   SUCCESS! Your code is on GitHub.
echo ========================================================
echo Now run 'install_on_server.bat' to deploy.
echo (Or just type: install_on_server.bat)
pause
exit

:get_identity
echo.
echo *** GIT SETUP ***
echo I need your name and email to save changes.
echo.
set /p GIT_NAME="Enter your Name: "
set /p GIT_EMAIL="Enter your Email: "
git config --global user.name "%GIT_NAME%"
git config --global user.email "%GIT_EMAIL%"
goto commit_files
