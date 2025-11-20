# Start FastAPI backend server for Windows
# Usage: .\run.ps1

Write-Host "🚀 Starting BasariYolu PDF Parser Backend..." -ForegroundColor Green

# Navigate to backend directory
Set-Location $PSScriptRoot

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "📦 Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Start server using python -m to ensure correct interpreter
Write-Host "✅ Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Write-Host "Press CTRL+C to stop the server"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
