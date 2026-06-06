@echo off
REM Quick Test Script for Flask-Migrate Environment
REM This verifies the setup can work

echo.
echo Testing Flask-Migrate Prerequisites...
echo.

REM Test Python
echo [1/5] Testing Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    goto failed
)
echo PASS: Python is available
echo.

REM Test pip
echo [2/5] Testing pip...
python -m pip --version
if errorlevel 1 (
    echo ERROR: pip not working
    goto failed
)
echo PASS: pip is available
echo.

REM Test directory structure
echo [3/5] Checking directory structure...
if exist "c:\credit-risk\backend\main.py" (
    echo PASS: Found c:\credit-risk\backend\main.py
) else (
    echo ERROR: c:\credit-risk\backend\main.py not found
    goto failed
)

if exist "c:\credit-risk\backend\models\user.py" (
    echo PASS: Found User model
) else (
    echo ERROR: User model not found
    goto failed
)

if exist "c:\credit-risk\requirements.txt" (
    echo PASS: Found requirements.txt
) else (
    echo ERROR: requirements.txt not found
    goto failed
)
echo.

REM Test Flask installation
echo [4/5] Testing Flask installation...
python -c "import flask; print('Flask version:', flask.__version__)" 2>nul
if errorlevel 1 (
    echo INFO: Flask not yet installed (will be installed during setup)
) else (
    echo PASS: Flask is already installed
)
echo.

REM Test Flask-Migrate
echo [5/5] Testing Flask-Migrate installation...
python -c "import flask_migrate; print('Flask-Migrate found')" 2>nul
if errorlevel 1 (
    echo INFO: Flask-Migrate not yet installed (will be installed during setup)
) else (
    echo PASS: Flask-Migrate is already installed
)
echo.

echo ========================================================================
echo RESULT: All prerequisites are met! Ready for Flask-Migrate setup.
echo ========================================================================
echo.
echo Next step: Run INIT_FLASK_MIGRATE.bat
echo.
pause
exit /b 0

:failed
echo.
echo ========================================================================
echo ERROR: Setup prerequisites not met
echo ========================================================================
echo.
pause
exit /b 1
