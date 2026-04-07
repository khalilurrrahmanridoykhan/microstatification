#!/bin/bash

# Production deployment script for ComMicPlan
echo "🚀 Starting production deployment..."

# Set production environment
export DEBUG=False
export DJANGO_SETTINGS_MODULE=backend.settings

# Navigate to project directory
cd /root/ComMicPlanV2

echo "📦 Installing/updating Python dependencies..."
source venv/bin/activate
pip install -r backend/requirements.txt

echo "🔄 Running Django migrations..."
cd backend
python manage.py makemigrations
python manage.py migrate

echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "🏗️ Building frontend..."
cd ../frontend
npm install
npm run build

echo "🔧 Setting up Nginx configuration..."
sudo cp /root/ComMicPlanV2/nginx_production.conf /etc/nginx/sites-available/commicplan
sudo ln -sf /etc/nginx/sites-available/commicplan /etc/nginx/sites-enabled/
sudo nginx -t

echo "🔄 Restarting services..."
# Kill any existing gunicorn processes
sudo pkill -f gunicorn

# Start gunicorn in background
cd /root/ComMicPlanV2/backend
source ../venv/bin/activate
nohup gunicorn backend.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 120 > gunicorn.log 2>&1 &

# Restart nginx
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "Frontend available at: https://dev.commicplan.com/"
echo "Backend API available at: https://dev.commicplan.com/api/"
echo ""
echo "To check status:"
echo "  - Gunicorn: ps aux | grep gunicorn"
echo "  - Nginx: sudo systemctl status nginx"
echo "  - Logs: tail -f /root/ComMicPlanV2/backend/gunicorn.log"
