#!/bin/bash
set -e

echo "========================================="
echo "DiviGrow Docker Deployment Script"
echo "========================================="
echo ""

# Step 1: Clone or update repository
echo "[1/6] Cloning repository..."
cd ~
if [ -d "divigrow-app" ]; then
    cd divigrow-app
    git pull origin main
    echo "✓ Repository updated"
else
    git clone https://github.com/Eman-ik/divigrow-app.git
    cd divigrow-app
    echo "✓ Repository cloned"
fi

# Step 2: Create client environment file
echo "[2/6] Configuring client environment..."
mkdir -p client
cat > client/.env << 'EOF'
VITE_API_URL=http://51.20.137.175:5001/api
EOF
echo "✓ Client .env created"

# Step 3: Stop existing containers
echo "[3/6] Stopping existing containers..."
docker-compose down 2>/dev/null || true
echo "✓ Old containers stopped"

# Step 4: Build and start new containers
echo "[4/6] Building and starting containers..."
docker-compose up --build -d
echo "✓ Containers started"

# Step 5: Wait for services to be ready
echo "[5/6] Waiting for services to initialize..."
sleep 10
echo "✓ Services initialized"

# Step 6: Verify deployment
echo "[6/6] Verifying deployment..."
echo ""
echo "========================================="
echo "Deployment Status:"
echo "========================================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "divi_|^NAMES"
echo ""
echo "========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "Access your application:"
echo "  Frontend:  http://51.20.137.175:3000"
echo "  API:       http://51.20.137.175:5001/api"
echo "  API Health: http://51.20.137.175:5001/api/health"
echo ""
echo "Useful commands:"
echo "  View logs:        docker-compose logs -f app"
echo "  Stop containers:  docker-compose down"
echo "  Restart services: docker-compose restart"
echo ""
