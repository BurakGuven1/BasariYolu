#!/bin/bash
# Start FastAPI backend server

echo "🚀 Starting BasariYolu PDF Parser Backend..."
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Start server using python -m to ensure correct interpreter
echo "✅ Starting FastAPI server on http://localhost:8000"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
