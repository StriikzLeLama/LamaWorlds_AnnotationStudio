# PowerShell script to install Python dependencies for the compiled app
# Run this from the app's release directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Python Backend Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python is not found in PATH!" -ForegroundColor Red
    Write-Host "Please install Python 3.10+ and add it to PATH." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Find the backend directory
$backendDir = $null
if (Test-Path "resources\backend") {
    $backendDir = "resources\backend"
} elseif (Test-Path "win-unpacked\resources\backend") {
    $backendDir = "win-unpacked\resources\backend"
} elseif (Test-Path "backend") {
    $backendDir = "backend"
} else {
    Write-Host "ERROR: Backend directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the release directory." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Backend directory: $backendDir" -ForegroundColor Cyan
Write-Host ""

# Check if requirements.txt exists
$requirementsPath = Join-Path $backendDir "requirements.txt"
if (-not (Test-Path $requirementsPath)) {
    Write-Host "ERROR: requirements.txt not found in $backendDir!" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Installing dependencies from requirements.txt..." -ForegroundColor Cyan
Write-Host ""

# Change to backend directory and install
Push-Location $backendDir
try {
    python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
        Write-Host "Try running: python -m pip install -r requirements.txt" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Dependencies installed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"

