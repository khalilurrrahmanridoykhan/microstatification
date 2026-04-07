#!/bin/bash

# Quick production start script
echo "🚀 Starting production server..."

# Set environment variables
export DEBUG=False
export DJANGO_SETTINGS_MODULE=backend.settings

# Navigate to project
cd /root/ComMicPlanV2

# Activate virtual environment
source venv/bin/activate

# Kill existing gunicorn processes
echo "🔄 Stopping existing gunicorn processes..."
sudo pkill -f gunicorn

# Start gunicorn for production
echo "🔄 Starting gunicorn server..."
cd backend
nohup gunicorn backend.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120 > gunicorn.log 2>&1 &

echo "✅ Gunicorn started!"
echo "Backend running at: http://127.0.0.1:8000"
echo "Check logs with: tail -f /root/ComMicPlanV2/backend/gunicorn.log"
echo ""
echo "🔍 Current gunicorn processes:"
ps aux | grep gunicorn | grep -v grep
