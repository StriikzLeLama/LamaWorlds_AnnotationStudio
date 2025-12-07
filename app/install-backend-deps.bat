@echo off
REM Script to install Python dependencies for the compiled app
REM Run this from the app's release directory

echo ========================================
echo Installing Python Backend Dependencies
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not found in PATH!
    echo Please install Python 3.10+ and add it to PATH.
    echo.
    pause
    exit /b 1
)

echo Python found:
python --version
echo.

REM Find the backend directory
if exist "resources\backend" (
    set BACKEND_DIR=resources\backend
) else if exist "win-unpacked\resources\backend" (
    set BACKEND_DIR=win-unpacked\resources\backend
) else if exist "backend" (
    set BACKEND_DIR=backend
) else (
    echo ERROR: Backend directory not found!
    echo Please run this script from the release directory.
    echo.
    pause
    exit /b 1
)

echo Backend directory: %BACKEND_DIR%
echo.

REM Check if requirements.txt exists
if not exist "%BACKEND_DIR%\requirements.txt" (
    echo ERROR: requirements.txt not found in %BACKEND_DIR%!
    echo.
    pause
    exit /b 1
)

echo Installing dependencies from requirements.txt...
echo.

cd /d "%BACKEND_DIR%"
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies!
    echo Try running: python -m pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Dependencies installed successfully!
echo ========================================
echo.
pause

