# EC2 DEPLOYMENT CHECKLIST ✅

## Your Configuration
- **EC2 IP**: 51.20.137.175
- **Key**: givi-grow.pem
- **Docker Hub**: emanmalik15/divi-grow
- **GitHub**: github.com/Eman-ik/divigrow-app

---

## ISSUES FOUND & FIXED

### ❌ Issue #1: Wrong Access URL
**Problem**: Trying to access `http://localhost:3001` won't work
- Local "localhost" only works on your personal machine
- Your app is on EC2 (cloud), not your local machine
- Docker container port 3000 is mapped to host port 3000

**✅ Fixed**: Use correct URL: **http://51.20.137.175:3000**

---

### ❌ Issue #2: Missing Client Environment File
**Problem**: `client/.env` didn't exist - frontend couldn't find API
**✅ Fixed**: Created with correct API URL pointing to EC2

---

### ❌ Issue #3: Database Init Missing Sample Data
**Problem**: Database table was empty after deployment
**✅ Fixed**: Added sample notes to `database/init.sql`

---

## DEPLOYMENT CHECKLIST

### ✅ Pre-Deployment (Already Done)
- [x] Dockerfile for server created
- [x] Dockerfile for client created
- [x] docker-compose.yml configured
- [x] nginx.conf configured
- [x] Database schema created (init.sql with sample data)
- [x] client/.env file created with correct API URL
- [x] DEPLOYMENT_GUIDE.md created
- [x] deploy.sh script created
- [x] Changes pushed to GitHub

### 📋 EC2 Deployment (You Need To Do)

**Step 1**: SSH into EC2
```bash
ssh -i givi-grow.pem ubuntu@51.20.137.175
```

**Step 2**: Clone latest code
```bash
git clone https://github.com/Eman-ik/divigrow-app.git
cd divigrow-app
```

OR Update if already cloned:
```bash
cd divigrow-app
git pull origin main
```

**Step 3**: Run deployment script
```bash
chmod +x deploy.sh
./deploy.sh
```

**Step 4**: Verify all containers running
```bash
docker ps
```

Expected output (3 containers):
```
CONTAINER ID   IMAGE                                   NAMES            PORTS
xxxxxxxxxxxxx   emanmalik15/divi-grow:notes-client    divi_client      0.0.0.0:3000->80/tcp
xxxxxxxxxxxxx   emanmalik15/divi-grow:notes-server    divi_app_server  0.0.0.0:5001->4000/tcp
xxxxxxxxxxxxx   postgres:15                           divi_app_db      0.0.0.0:5432->5432/tcp
```

**Step 5**: Check API is running
```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{"status":"ok"}
```

---

## 🎯 VERIFY IT'S WORKING

After deployment completes:

### From Your Local Machine (or any browser)
1. **Frontend**: Open http://51.20.137.175:3000
   - Should see the Notes application
   - Should load without console errors

2. **Test Database**: Create a new note in the UI
   - Click "Add Note"
   - Enter title and content
   - Click Save
   - Should appear in the list

3. **Check Persistence**: Restart containers
   ```bash
   docker-compose restart
   ```
   - Wait 10 seconds
   - Refresh browser
   - Your note should still be there ✅

### From EC2 Instance (troubleshooting)
```bash
# Check frontend logs
docker logs divi_client

# Check server logs  
docker logs divi_app_server

# Check database logs
docker logs divi_app_db

# Check database connectivity from server
docker exec divi_app_server npm test
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Connection refused" on port 3000
**Check 1**: Containers running?
```bash
docker ps | grep divi_client
```

**Check 2**: Port exposed correctly in docker-compose.yml?
```bash
grep -A 3 "ports:" docker-compose.yml | head -10
```

**Check 3**: EC2 Security Group allows inbound 3000?
- Go to AWS EC2 console
- Check Security Group inbound rules
- Add rule: TCP 3000 from 0.0.0.0/0

---

### Issue: Frontend says "Cannot reach API"
**Check**: Server logs for errors
```bash
docker logs divi_app_server | tail -20
```

**Check**: API URL in environment
```bash
docker exec divi_app_server env | grep API
```

Should show:
```
VITE_API_URL=http://51.20.137.175:5001/api
```

---

### Issue: Database not initializing
**Check**: Database logs
```bash
docker logs divi_app_db | tail -10
```

**Check**: init.sql file exists
```bash
ls -la database/init.sql
```

**Full Reset** (WARNING: Deletes all data and volumes):
```bash
docker-compose down -v
docker-compose up --build -d
```

---

## 📊 ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│  Your Computer (Browser)                            │
│  http://51.20.137.175:3000                          │
└────────────────────┬────────────────────────────────┘
                     │
                     │ HTTP/HTTPS
                     │
┌────────────────────▼────────────────────────────────┐
│  EC2 Instance (51.20.137.175)                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Docker & Docker Compose                    │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ divi_client (Nginx)                 │   │   │
│  │  │ Port 3000 → Container Port 80       │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ divi_app_server (Node.js)           │   │   │
│  │  │ Port 5001 → Container Port 4000     │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │ divi_app_db (PostgreSQL)            │   │   │
│  │  │ Port 5432 → Container Port 5432     │   │   │
│  │  │ Volume: postgres_data (persistent)  │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 📝 SUMMARY

| Component | Status | Details |
|-----------|--------|---------|
| Dockerfiles | ✅ Ready | Optimized with multi-stage builds |
| docker-compose.yml | ✅ Ready | Configured with volumes and networking |
| GitHub Repo | ✅ Updated | All fixes pushed to eman-ik/divigrow-app |
| Docker Hub | ✅ Exists | emanmalik15/divi-grow ready to use |
| Deployment Script | ✅ Ready | Easy one-command deployment |
| EC2 Readiness | 🟡 Pending | Awaiting: Run deploy.sh on EC2 |

---

## ⏭️ NEXT STEPS

1. **Now**: SSH into EC2 instance
2. **Clone**: Latest code from GitHub
3. **Deploy**: Run `./deploy.sh`
4. **Verify**: Check http://51.20.137.175:3000 works
5. **Test**: Create a note and verify persistence
6. **Done**: Your containerized app is live on AWS! 🎉

---

Need help? Check DEPLOYMENT_GUIDE.md for detailed steps.
