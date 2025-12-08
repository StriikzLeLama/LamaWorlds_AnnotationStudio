@echo off
REM Launcher script for Windows - checks Python before starting the app

echo ========================================
echo Lama Worlds Annotation Studio Launcher
echo ========================================
echo.

REM Check Python
node "%~dp0check-python.js"
if errorlevel 1 (
    echo.
    echo Python check failed. Please install Python 3.10+ and dependencies.
    pause
    exit /b 1
)

echo.
echo Starting application...
echo.

REM Start the Electron app
"%~dp0..\release\win-unpacked\Lama Worlds Annotation Studio.exe"

