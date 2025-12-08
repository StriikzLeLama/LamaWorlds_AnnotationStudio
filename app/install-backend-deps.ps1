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

# Find the backend directory and requirements.txt
$backendDir = $null
$requirementsFile = $null

# Try different locations
if (Test-Path "resources\backend") {
    $backendDir = "resources\backend"
    if (Test-Path "resources\requirements.txt") {
        $requirementsFile = "resources\requirements.txt"
    } elseif (Test-Path "resources\backend\requirements.txt") {
        $requirementsFile = "resources\backend\requirements.txt"
    }
} elseif (Test-Path "win-unpacked\resources\backend") {
    $backendDir = "win-unpacked\resources\backend"
    if (Test-Path "win-unpacked\resources\requirements.txt") {
        $requirementsFile = "win-unpacked\resources\requirements.txt"
    } elseif (Test-Path "win-unpacked\resources\backend\requirements.txt") {
        $requirementsFile = "win-unpacked\resources\backend\requirements.txt"
    }
} elseif (Test-Path "backend") {
    $backendDir = "backend"
    if (Test-Path "requirements.txt") {
        $requirementsFile = "requirements.txt"
    } elseif (Test-Path "backend\requirements.txt") {
        $requirementsFile = "backend\requirements.txt"
    }
}

if ($null -eq $backendDir) {
    Write-Host "ERROR: Backend directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the release directory." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

if ($null -eq $requirementsFile) {
    Write-Host "ERROR: requirements.txt not found!" -ForegroundColor Red
    Write-Host "Searched in:" -ForegroundColor Yellow
    Write-Host "  - resources\requirements.txt"
    Write-Host "  - resources\backend\requirements.txt"
    Write-Host "  - win-unpacked\resources\requirements.txt"
    Write-Host "  - win-unpacked\resources\backend\requirements.txt"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Backend directory: $backendDir" -ForegroundColor Cyan
Write-Host "Requirements file: $requirementsFile" -ForegroundColor Cyan
Write-Host ""

Write-Host "Installing dependencies from requirements.txt..." -ForegroundColor Cyan
Write-Host ""

# Install from the requirements file location
python -m pip install -r $requirementsFile
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    Write-Host "Try running: python -m pip install -r $requirementsFile" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Dependencies installed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"

