# DiviGrow Docker Deployment Guide

## Current Status
- ✅ Dockerfiles created (client & server)
- ✅ docker-compose.yml configured
- ✅ GitHub repo: eman-ik/divigrow-app
- ✅ Docker Hub image: emanmalik15/divi-grow
- ❌ **Application not accessible** - ACTION REQUIRED

## Issues Fixed
1. Created `client/.env` with correct API URL for Docker environment
2. Updated `database/init.sql` with sample data
3. All containers configured correctly

## Deployment Steps on EC2

### Step 1: SSH into your EC2 instance
```bash
ssh -i givi-grow.pem ubuntu@51.20.137.175
```

### Step 2: Clone/update repository
```bash
git clone https://github.com/eman-ik/divigrow-app.git
cd divigrow-app
git pull origin main
```

### Step 3: Stop any running containers
```bash
docker-compose down
```

### Step 4: Build and start containers
```bash
docker-compose up --build -d
```

Verify containers are running:
```bash
docker ps
```

You should see 3 containers:
- divi_client (port 3000:80)
- divi_app_server (port 5001:4000)
- divi_app_db (port 5432:5432)

### Step 5: Access the application
**IMPORTANT**: Access via EC2 IP, NOT localhost

- **Frontend**: http://51.20.137.175:3000
- **API**: http://51.20.137.175:5001/api
- **API Health**: http://51.20.137.175:5001/api/health

### Step 6: Verify database connection
```bash
docker logs divi_app_server
```

Look for: "Database connected successfully" or similar positive logs

## Configuration Summary

### Port Mappings
| Service | Container Port | Host Port | Access |
|---------|---|---|---|
| Client (Nginx) | 80 | 3000 | http://51.20.137.175:3000 |
| Server (Node) | 4000 | 5001 | http://51.20.137.175:5001 |
| Database | 5432 | 5432 | localhost:5432 (internal only) |

### Environment Variables (docker-compose.yml)
- `VITE_API_URL`: http://51.20.137.175:5001/api
- `CORS_ORIGIN`: http://51.20.137.175:3000
- `DB_HOST`: db (Docker internal DNS)
- `DB_NAME`: divi_db
- Database credentials: postgres/postgres123

### Data Persistence
- Database data stored in Docker volume: `postgres_data`
- Location on host: `/var/lib/docker/volumes/postgres_data/_data`

## Troubleshooting

### Issue: "Connection refused" on port 3000
- Check: `docker ps` - ensure divi_client is running
- Check: EC2 Security Group allows inbound on port 3000
- Try: `curl http://localhost:3000` inside the EC2 instance

### Issue: Frontend says "Cannot reach API"
- Check: `docker logs divi_app_server` for errors
- Check: Frontend logs in browser DevTools (F12)
- Verify: API URL built correctly: http://51.20.137.175:5001/api

### Issue: Database not initializing
- Check: `docker logs divi_app_db`
- Verify: `database/init.sql` exists and contains valid SQL
- Check: Volume mounted correctly in docker-compose

### Quick Restart
```bash
docker-compose restart
```

### Full Reset (⚠️ DELETES DATA)
```bash
docker-compose down -v  # -v removes volumes
docker-compose up --build -d
```

## Next Steps
1. Push latest changes to GitHub
2. SSH into EC2 and follow deployment steps above
3. Access frontend at http://51.20.137.175:3000
4. Test creating/editing notes
5. Verify database persistence

## Docker Hub Image
If you need to push latest image:
```bash
docker build -t emanmalik15/divi-grow:notes-server ./server
docker build -t emanmalik15/divi-grow:notes-client ./client
docker push emanmalik15/divi-grow:notes-server
docker push emanmalik15/divi-grow:notes-client
```
