@echo off
REM Flask-Migrate Initialization Script for Credit-Risk Project
REM This batch file automates the complete Flask-Migrate setup

setlocal enabledelayedexpansion

echo.
echo ========================================================================
echo  Flask-Migrate Initialization for Credit-Risk Project
echo ========================================================================
echo.

REM Step 1: Install requirements
echo [Step 1/9] Installing Python dependencies...
echo Command: python -m pip install -r requirements.txt
cd /d c:\credit-risk
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo WARNING: pip install reported some issues, continuing anyway...
) else (
    echo [Step 1] SUCCESS: Dependencies installed
)
echo.

REM Step 2: Change to backend directory
echo [Step 2/9] Changing to backend directory...
cd /d c:\credit-risk\backend
echo [Step 2] SUCCESS: Changed to c:\credit-risk\backend
echo.

REM Step 3: Set FLASK_APP environment variable
echo [Step 3/9] Setting environment variable FLASK_APP=main.py
set FLASK_APP=main.py
echo [Step 3] SUCCESS: FLASK_APP=%FLASK_APP%
echo.

REM Step 4: Initialize Flask-Migrate
echo [Step 4/9] Initializing Flask-Migrate...
echo Command: python -m flask db init
python -m flask db init
if errorlevel 1 (
    echo [Step 4] ERROR: Failed to initialize Flask-Migrate
    goto error
) else (
    echo [Step 4] SUCCESS: Flask-Migrate initialized
)
echo.

REM Step 5: Verify migrations folder
echo [Step 5/9] Verifying migrations folder exists...
if exist "c:\credit-risk\backend\migrations\" (
    echo [Step 5] SUCCESS: migrations folder exists at c:\credit-risk\backend\migrations
) else (
    echo [Step 5] ERROR: migrations folder not found!
    goto error
)
echo.

REM Step 6: Create migration for subscription columns
echo [Step 6/9] Creating database migration...
echo Command: python -m flask db migrate -m "Add subscription columns to users"
python -m flask db migrate -m "Add subscription columns to users"
if errorlevel 1 (
    echo [Step 6] ERROR: Migration creation failed
    goto error
) else (
    echo [Step 6] SUCCESS: Migration created
)
echo.

REM Step 7: Apply migrations to database
echo [Step 7/9] Applying migrations to database...
echo Command: python -m flask db upgrade
python -m flask db upgrade
if errorlevel 1 (
    echo [Step 7] ERROR: Database upgrade failed
    goto error
) else (
    echo [Step 7] SUCCESS: Database upgraded
)
echo.

REM Step 8: Verify database file
echo [Step 8/9] Verifying database file...
if exist "c:\credit-risk\credit_risk.db" (
    echo [Step 8] SUCCESS: Database file exists at c:\credit-risk\credit_risk.db
) else (
    echo [Step 8] WARNING: Database file not found at expected location
)
echo.

REM Step 9: Final verification
echo [Step 9/9] Final verification...
echo.

setlocal enabledelayedexpansion
set count=0

if exist "c:\credit-risk\backend\migrations\" (
    echo   [✓] migrations folder exists
    set /a count+=1
)

if exist "c:\credit-risk\backend\migrations\alembic.ini" (
    echo   [✓] alembic.ini file exists
    set /a count+=1
)

if exist "c:\credit-risk\backend\migrations\env.py" (
    echo   [✓] env.py file exists
    set /a count+=1
)

if exist "c:\credit-risk\backend\migrations\versions\" (
    echo   [✓] versions folder exists
    set /a count+=1
    REM Count migration files
    for /f %%F in ('dir /b "c:\credit-risk\backend\migrations\versions\*.py" 2^>nul ^| find /c /v ""') do (
        set migration_count=%%F
    )
    if !migration_count! gtr 0 (
        echo   [✓] !migration_count! migration files created
        set /a count+=1
    )
)

if exist "c:\credit-risk\credit_risk.db" (
    echo   [✓] Database file created
    set /a count+=1
)

echo.
echo ========================================================================
echo  FLASK-MIGRATE SETUP COMPLETE
echo ========================================================================
echo.
echo Verification Summary:
echo   - Expected checks: 6
echo   - Passed checks: !count!
echo.

if !count! equ 6 (
    echo [✓] ALL CHECKS PASSED - Flask-Migrate successfully initialized!
    echo.
    echo Your database is ready to use. You can now:
    echo   1. Start the application: python run.py
    echo   2. Create new migrations: flask db migrate -m "Description"
    echo   3. Apply migrations: flask db upgrade
    echo.
    pause
    exit /b 0
) else (
    echo [!] Some checks failed. Please review the output above.
    echo.
    pause
    exit /b 1
)

:error
echo.
echo ========================================================================
echo  ERROR - Flask-Migrate Setup Failed
echo ========================================================================
echo.
echo Please check the error messages above and try again.
echo.
pause
exit /b 1
