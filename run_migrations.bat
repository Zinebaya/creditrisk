@echo off
setlocal enabledelayedexpansion

cd /d c:\credit-risk

echo.
echo ================================================================================
echo STEP 1: Installing requirements.txt
echo ================================================================================
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install requirements
    exit /b 1
)
echo ✓ Requirements installed successfully
echo.

echo ================================================================================
echo STEP 2: Running 'flask db init' from backend directory
echo ================================================================================
cd /d c:\credit-risk\backend
set FLASK_APP=main.py
python -m flask db init
if errorlevel 1 (
    echo ❌ Failed to initialize Flask-Migrate
    exit /b 1
)
echo ✓ Flask-Migrate initialized
echo.

if exist "migrations" (
    echo ✓ migrations/ folder created successfully
    if exist "migrations\alembic.ini" (
        echo ✓ alembic.ini found
    )
    if exist "migrations\versions" (
        echo ✓ versions/ folder found
    )
) else (
    echo ❌ migrations/ folder was NOT created
)
echo.

echo ================================================================================
echo STEP 3: Running 'flask db migrate'
echo ================================================================================
python -m flask db migrate -m "Add subscription columns to users"
if errorlevel 1 (
    echo ❌ Failed to create migration
    exit /b 1
)
echo ✓ Migration created successfully
echo.

echo ================================================================================
echo STEP 4: Running 'flask db upgrade'
echo ================================================================================
python -m flask db upgrade
if errorlevel 1 (
    echo ❌ Failed to upgrade database
    exit /b 1
)
echo ✓ Database upgraded successfully
echo.

echo ================================================================================
echo VERIFICATION
echo ================================================================================
cd /d c:\credit-risk\backend
if exist "migrations" (
    echo ✓ migrations/ folder exists
    dir /b migrations
) else (
    echo ❌ migrations/ folder does not exist
)
echo.

if exist "..\credit_risk.db" (
    echo ✓ credit_risk.db database file exists
    for %%F in (..\credit_risk.db) do echo   Size: %%~zF bytes
) else (
    echo ⚠ credit_risk.db not found ^(may be created on first access^)
)
echo.

echo ================================================================================
echo ✓ ALL STEPS COMPLETED SUCCESSFULLY
echo ================================================================================
endlocal
