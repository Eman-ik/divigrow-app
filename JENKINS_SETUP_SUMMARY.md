# Jenkins Setup & Submission Summary

## 🎯 Your Assignment Status

| Component | Status | Details |
|-----------|--------|---------|
| **Part I - Docker Deployment** | ✅ Complete | Running on EC2 at 51.20.137.175:3000 |
| **Part II - Jenkins Pipeline** | ✅ Ready | Jenkinsfile + docker-compose.jenkins.yml created |
| **GitHub Repository** | ✅ Ready | https://github.com/Eman-ik/divigrow-app |
| **Docker Hub** | ✅ Ready | emanmalik15/divi-grow images available |
| **Documentation** | ✅ Complete | Comprehensive guides created |
| **Collaborator** | ⏳ Pending | Need to add qasimalik@gmail.com |
| **Submission** | ⏳ Pending | Google Form + Report |

---

## 🔧 Jenkins Setup Instructions

### **Step 1: Create Jenkins Instance Password & Save URL**

Since you mentioned you forgot your Jenkins password, here's how to reset it:

#### **Reset Jenkins Admin Password**

```bash
# SSH into EC2
ssh -i divi-grow.pem ubuntu@51.20.137.175

# Stop Jenkins
sudo systemctl stop jenkins

# Edit Jenkins configuration
sudo nano /var/lib/jenkins/config.xml

# Find and change:
# Change: <useSecurity>true</useSecurity>
# To:     <useSecurity>false</useSecurity>

# Restart Jenkins
sudo systemctl start jenkins

# Access Jenkins (no auth required temporarily)
# http://51.20.137.175:8080
```

#### **Set New Security Password**

1. Open: http://51.20.137.175:8080
2. **Manage Jenkins** → **Security**
3. Enable **Jenkins' own user database**
4. Click **Create First Admin User**
5. Fill in:
   - Username: `admin`
   - Password: (your new password)
   - Full name: Your name
6. Click **Create User and Start**

**✅ SAVE THIS DOWN:**
- **Jenkins URL**: http://51.20.137.175:8080
- **Username**: admin
- **Password**: (your password)

---

### **Step 2: Verify Required Plugins**

1. Jenkins → **Manage Jenkins** → **Manage Plugins**
2. Go to **Installed** tab
3. Verify these are installed:
   - ✅ **Git** plugin
   - ✅ **Pipeline** plugin
   - ✅ **Docker Pipeline** plugin
   - ✅ **GitHub Integration** plugin (optional but recommended)

If missing, search and install:
- Search for plugin name
- Click checkbox
- Click **Install without restart**
- Restart Jenkins when done

---

### **Step 3: Create Pipeline Job**

1. Jenkins home → **New Item**
2. Enter name: `DiviGrow`
3. Select: **Pipeline**
4. Click **OK**

#### **Configure Pipeline**

Under **Pipeline** section:

**Definition**: Select `Pipeline script from SCM`

**SCM**: Select `Git`

**Repository URL**: `https://github.com/Eman-ik/divigrow-app.git`

**Branch**: `*/main`

**Script Path**: `Jenkinsfile`

5. Click **Save**

---

### **Step 4: Configure GitHub Webhook**

#### **In Jenkins**:

1. **Jenkins** → **Manage Jenkins** → **System**
2. Scroll to **GitHub** section
3. Check: `Manage hooks`
4. Click **Test connection** (to verify GitHub integration)

#### **In GitHub**:

1. Go to https://github.com/Eman-ik/divigrow-app
2. **Settings** → **Webhooks** → **Add webhook**
3. Fill in:
   - **Payload URL**: `http://51.20.137.175:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Select `Push events`
   - **Active**: ✓ Check
4. Click **Add webhook**

5. Scroll to **Recent Deliveries** to verify webhook is working (green checkmark)

---

### **Step 5: Test Pipeline**

#### **Manual Trigger** (First Test)

1. Jenkins → **DiviGrow** job  
2. Click **Build Now**
3. Watch the build progress
4. Click on build number to see **Console Output**

#### **Expected Output**:

```
========== BUILD SUCCESSFUL ==========
✓ Code checked out
✓ Docker validated
✓ Containers stopped
✓ Containers built
✓ Services verified
✓ Health checks passed
```

#### **Verify Containers Running**:

```bash
# SSH to EC2
ssh -i divi-grow.pem ubuntu@51.20.137.175

# Check containers
docker ps | grep jenkins
```

---

### **Step 6: Test GitHub Integration**

Make a test push to trigger pipeline automatically:

```bash
# On your local machine
cd divigrow-app

# Make a small change
echo "# Test webhook" >> README.md

# Push to GitHub
git add README.md
git commit -m "Test webhook trigger"
git push origin main
```

**Jenkins will automatically start the build!**

Check: Jenkins home → **DiviGrow** → **Build History**

---

## 📋 Pre-Submission Checklist

Before submitting, verify:

### **GitHub Repository**
- [ ] Repository: https://github.com/Eman-ik/divigrow-app
- [ ] Files present:
  - [ ] Jenkinsfile (Part II pipeline)
  - [ ] docker-compose.yml (Part I)
  - [ ] docker-compose.jenkins.yml (Part II)
  - [ ] server/Dockerfile
  - [ ] client/Dockerfile
  - [ ] Documentation files
- [ ] Collaborator added: qasimalik@gmail.com with Admin access

### **Part I - Docker Deployment**
- [ ] Deploy running: `docker-compose up -d`
- [ ] Containers running: `docker ps`
- [ ] Frontend accessible: http://51.20.137.175:3000
- [ ] API working: http://51.20.137.175:5001/api/health
- [ ] Database persisting: Volume `postgres_data` exists

### **Part II - Jenkins Pipeline**
- [ ] Jenkins URL works: http://51.20.137.175:8080
- [ ] Login created with password
- [ ] DiviGrow pipeline job created
- [ ] Plugins installed: Git, Pipeline, Docker Pipeline
- [ ] GitHub webhook configured and tested
- [ ] Manual build trigger works
- [ ] Webhook trigger works (automatic on push)
- [ ] Build logs show all 7 stages completing

### **Documentation**
- [ ] Comprehensive report created: COMPREHENSIVE_REPORT.md
- [ ] Includes application description
- [ ] Includes architecture diagrams
- [ ] Includes all Dockerfiles and compose files
- [ ] Includes Jenkins pipeline script
- [ ] Includes micro-steps for both parts
- [ ] Includes screenshots and evidence

---

## 📤 Submission Steps

### **Step 1: Fill Google Form**

Go to: https://forms.gle/ubA9DRzQSudr2qhY6

Fill in:
- **Part I URL**: http://51.20.137.175:3000 (your deployed app)
- **Part II URL**: http://51.20.137.175:8080 (your Jenkins)
- **GitHub**: https://github.com/Eman-ik/divigrow-app
- **Email**: Your email
- Any additional notes

### **Step 2: Submit Report**

Create a PDF or document with:

**Use format from COMPREHENSIVE_REPORT.md**

Include:
1. Executive Summary
2. Application Overview
3. Architecture (diagrams)
4. Part I - Containerization
   - Dockerfile contents
   - docker-compose.yml
   - Deployment steps
   - Screenshot: `docker ps` output
   - Screenshot: Application running
5. Part II - Jenkins Pipeline
   - Jenkinsfile content
   - docker-compose.jenkins.yml
   - Pipeline stages explained
   - GitHub webhook setup
   - Screenshot: Jenkins interface
   - Screenshot: Successful build
6. Implementation steps (micro-steps)
7. Troubleshooting guide
8. Submission info

### **Step 3: Push Final Changes**

```bash
cd divigrow-app

# Make sure all files committed
git status

# If changes exist:
git add .
git commit -m "Final submission - Part I & II complete"
git push origin main
```

### **Step 4: Verify Collaborator**

Ensure qasimalik@gmail.com has access:

1. GitHub → Settings → Collaborators
2. Confirm: `qasimalik@gmail.com` appears with **Admin** role

---

## 🔗 Important URLs for Submission Form

Copy these into the Google Form:

```
Part I URL (Production Deployment):
http://51.20.137.175:3000

Part II URL (Jenkins):
http://51.20.137.175:8080

GitHub Repository:
https://github.com/Eman-ik/divigrow-app

Docker Hub (optional):
https://hub.docker.com/r/emanmalik15/divi-grow

Collaborator Email:
qasimalik@gmail.com
```

---

## 📊 Expected Results

### **Part I - Should Be Running**
```bash
$ docker ps
CONTAINER ID   IMAGE                             STATUS         PORTS
abc123...      emanmalik15/divi-grow:notes-client  Up 2 hours    0.0.0.0:3000->80/tcp
def456...      emanmalik15/divi-grow:notes-server  Up 2 hours    0.0.0.0:5001->4000/tcp
ghi789...      postgres:15                         Up 2 hours    0.0.0.0:5432->5432/tcp
```

### **Part II - Status Check via Jenkins**

Jenkins Console Output shows:
```
✅ Checkout Code - PASSED
✅ Validate Configuration - PASSED
✅ Clean Previous Deployment - PASSED
✅ Build & Deploy Containers - PASSED
✅ Verify Deployment - PASSED
✅ Health Check - PASSED
✅ Build Report - PASSED

BUILD SUCCESSFUL in 2m 15s
```

---

## 🚀 Quick Reference

### **Start/Stop Part I (Production)**
```bash
# Start
docker-compose up -d

# Stop (and keep data)
docker-compose down

# Hard reset (delete all data)
docker-compose down -v
```

### **Trigger Part II (Jenkins)**
```bash
# Manual trigger
# Jenkins → DiviGrow → Build Now

# Automatic trigger (via webhook)
git push origin main
```

### **Monitor Deployments**
```bash
# See running containers
docker ps

# View Part I logs
docker-compose logs -f

# View Part II logs
docker logs app_jenkins

# Check database
docker exec -it <db_container> psql -U postgres -d divigrow_db -c "SELECT * FROM notes;"
```

---

## ❓ Support

If you have any issues:

1. **Check logs**: `docker-compose logs` or `docker logs`
2. **See documentation**: COMPREHENSIVE_REPORT.md, DEPLOYMENT_GUIDE.md
3. **Webhook issues**: GITHUB_WEBHOOK_SETUP.md
4. **Collaborator help**: ADD_COLLABORATOR_GUIDE.md
5. **Jenkins help**: Visit http://51.20.137.175:8080 → Help

---

## ✅ Assignment Complete!

You now have:
- ✅ **Part I**: Fully containerized application running on EC2
- ✅ **Part II**: Jenkins CI/CD pipeline with GitHub integration
- ✅ **Documentation**: Comprehensive guides and playbooks
- ✅ **Submission Ready**: All files in GitHub, forms ready to fill

**Next**: Fill out the Google Form and submit this summary + comprehensive report!

---

**Generated**: April 17, 2026
**Status**: Ready for Submission ✅
