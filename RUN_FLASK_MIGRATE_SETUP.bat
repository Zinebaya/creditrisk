@echo off
REM Flask-Migrate Initialization Batch Script
REM Double-click this file to initialize Flask-Migrate for the credit-risk project

echo.
echo ======================================================================
echo  FLASK-MIGRATE INITIALIZATION FOR CREDIT-RISK PROJECT
echo ======================================================================
echo.

cd /d c:\credit-risk

if not exist "flask_migrate_init.py" (
    echo ERROR: flask_migrate_init.py not found in c:\credit-risk
    echo Please ensure the script is in the correct directory.
    pause
    exit /b 1
)

echo Running Flask-Migrate initialization...
echo.

python flask_migrate_init.py

if errorlevel 1 (
    echo.
    echo ======================================================================
    echo  INITIALIZATION FAILED
    echo ======================================================================
    echo.
    echo Some steps failed. Please check the error messages above.
    pause
    exit /b 1
) else (
    echo.
    echo ======================================================================
    echo  INITIALIZATION COMPLETED SUCCESSFULLY
    echo ======================================================================
    echo.
    echo Next steps:
    echo   1. Run: cd c:\credit-risk
    echo   2. Run: python run.py
    echo   3. Open: http://localhost:5000
    echo.
)

pause
