@echo off
echo ========================================
echo   SETTING UP GITHUB REPOSITORY
echo ========================================
echo.

:: 1. Initialize Git
if not exist .git (
    echo Initializing new Git repository...
    git init
    git branch -M main
) else (
    echo Git repository already exists.
)

:: 2. Add Files
echo.
echo Adding files to staging...
git add .

:: 3. Initial Commit
echo.
echo Committing files...
git commit -m "Initial commit for Polyclinic V2"

echo.
echo ========================================
echo   NEXT STEPS
echo ========================================
echo 1. Go to GitHub.com and create a NEW Repository named 'Polyclinic'.
echo 2. Copy the URL (e.g., https://github.com/YourUser/Polyclinic.git).
echo 3. Run the following command (replacing the URL):
echo    git remote add origin YOUR_GITHUB_URL
echo    git push -u origin main
echo.
pause
