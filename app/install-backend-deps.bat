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

REM Find the backend directory and requirements.txt
set BACKEND_DIR=
set REQUIREMENTS_FILE=

REM Try different locations
if exist "resources\backend" (
    set BACKEND_DIR=resources\backend
    if exist "resources\requirements.txt" (
        set REQUIREMENTS_FILE=resources\requirements.txt
    ) else if exist "resources\backend\requirements.txt" (
        set REQUIREMENTS_FILE=resources\backend\requirements.txt
    )
) else if exist "win-unpacked\resources\backend" (
    set BACKEND_DIR=win-unpacked\resources\backend
    if exist "win-unpacked\resources\requirements.txt" (
        set REQUIREMENTS_FILE=win-unpacked\resources\requirements.txt
    ) else if exist "win-unpacked\resources\backend\requirements.txt" (
        set REQUIREMENTS_FILE=win-unpacked\resources\backend\requirements.txt
    )
) else if exist "backend" (
    set BACKEND_DIR=backend
    if exist "requirements.txt" (
        set REQUIREMENTS_FILE=requirements.txt
    ) else if exist "backend\requirements.txt" (
        set REQUIREMENTS_FILE=backend\requirements.txt
    )
)

if "%BACKEND_DIR%"=="" (
    echo ERROR: Backend directory not found!
    echo Please run this script from the release directory.
    echo.
    pause
    exit /b 1
)

if "%REQUIREMENTS_FILE%"=="" (
    echo ERROR: requirements.txt not found!
    echo Searched in:
    echo   - resources\requirements.txt
    echo   - resources\backend\requirements.txt
    echo   - win-unpacked\resources\requirements.txt
    echo   - win-unpacked\resources\backend\requirements.txt
    echo.
    pause
    exit /b 1
)

echo Backend directory: %BACKEND_DIR%
echo Requirements file: %REQUIREMENTS_FILE%
echo.

echo Installing dependencies from requirements.txt...
echo.

REM Install from the requirements file location
python -m pip install -r "%REQUIREMENTS_FILE%"

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

