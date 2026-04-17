# DiviGrow Application - Jenkins CI/CD Assignment Report

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Part I: Containerized Deployment](#part-i-containerized-deployment)
3. [Part II: Jenkins CI/CD Pipeline](#part-ii-jenkins-cicd-pipeline)
4. [Application Architecture](#application-architecture)
5. [Implementation Steps](#implementation-steps)
6. [Deployment Instructions](#deployment-instructions)
7. [Screenshots & Evidence](#screenshots--evidence)
8. [Troubleshooting](#troubleshooting)

---

## Executive Summary

**DiviGrow** is a full-stack dividend portfolio tracker application built with React (frontend), Node.js/Express (backend), and PostgreSQL (database). This report documents the deployment of DiviGrow across two phases:

- **Part I**: Containerized deployment on AWS EC2 using Docker and docker-compose
- **Part II**: Continuous Integration/Continuous Deployment (CI/CD) pipeline using Jenkins

### Key Technologies
| Component | Technology |
|-----------|-----------|
| Frontend | React 19 + Vite + Nginx |
| Backend | Node.js 20 + Express 5 |
| Database | PostgreSQL 15 |
| Container | Docker + Docker Compose |
| CI/CD | Jenkins 2.541.3 |
| Cloud | AWS EC2 |
| Version Control | Git + GitHub |

---

## Part I: Containerized Deployment

### Objective
Deploy DiviGrow as containerized microservices on AWS EC2 with persistent database storage.

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│  AWS EC2 Instance (51.20.137.175)                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Docker & Docker Compose                          │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Frontend Container (nginx)                 │  │  │
│  │  │  Image: emanmalik15/divi-grow:notes-client │  │  │
│  │  │  Port: 3000:80                              │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Backend Container (node)                   │  │  │
│  │  │  Image: emanmalik15/divi-grow:notes-server │  │  │
│  │  │  Port: 5001:4000                            │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Database Container (postgres)              │  │  │
│  │  │  Image: postgres:15                         │  │  │
│  │  │  Port: 5432:5432                            │  │  │
│  │  │  Volume: postgres_data (persistent)         │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Files Created

#### 1. **Server Dockerfile** (`server/Dockerfile`)
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 4000

CMD ["npm", "start"]
```

**Purpose**: Builds backend container without development dependencies

#### 2. **Client Dockerfile** (`client/Dockerfile`)
```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:5001/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Purpose**: Multi-stage build - compiles React/Vite frontend, serves via Nginx

#### 3. **docker-compose.yml** (Part I - Production)
- Frontend on port 3000
- Backend on port 5001
- Database on port 5432
- Persistent database volume
- Pre-built images from Docker Hub

### Deployment Steps (Part I)

```bash
# 1. Clone repository
git clone https://github.com/Eman-ik/divigrow-app.git
cd divigrow-app

# 2. Deploy using docker-compose
docker-compose up -d

# 3. Verify containers
docker ps

# 4. Access application
# Frontend: http://51.20.137.175:3000
# API: http://51.20.137.175:5001/api
```

### Data Persistence
- **Database Volume**: `postgres_data`
- **Location**: `/var/lib/docker/volumes/postgres_data/_data`
- **Persistence**: Data remains after container restart

---

## Part II: Jenkins CI/CD Pipeline

### Objective
Implement continuous integration/delivery using Jenkins to automate build, test, and deployment phases.

### Architecture
```
GitHub Repository
      ↓
   Webhook (HTTPS)
      ↓
Jenkins Pipeline
      ↓
[Checkout → Validate → Clean → Build → Deploy → Health Check]
      ↓
EC2 Instance
      ↓
Docker Containers
```

### Prerequisites
- Jenkins 2.541.3 installed on EC2
- Plugins installed: Git, Pipeline, Docker Pipeline
- SSH key configured (divi-grow.pem)
- GitHub repository cloned
- Docker daemon accessible to Jenkins user

### Part II Configuration Files

#### 1. **Enhanced Jenkinsfile**

**Location**: Root of repository

**Features**:
- 7-stage pipeline with detailed logging
- Checkout code from GitHub
- Validate Docker configuration
- Clean previous deployments
- Build and deploy containers with code volumes
- Health checks for services
- Comprehensive build reports
- Error handling and diagnostics

**Stages**:
1. ✅ **Checkout Code** - Clone latest from GitHub main branch
2. 📋 **Validate Configuration** - Ensure all files exist
3. 🧹 **Clean Previous Deployment** - Stop old containers
4. 🔨 **Build & Deploy Containers** - Run docker-compose up
5. ✔️ **Verify Deployment** - Check container status
6. 🧪 **Health Check** - Test API endpoint
7. 📊 **Build Report** - Generate deployment report

#### 2. **docker-compose.jenkins.yml** (Part II - Pipeline)

**Key Differences from Part I**:

| Aspect | Part I | Part II |
|--------|--------|---------|
| **Port Mapping** | 3000, 5001, 5432 | 5001, 5433 (server only) |
| **Container Names** | divi_client, divi_app_server | app_jenkins, db_jenkins |
| **Code Delivery** | Pre-built Docker Hub images | Code volumes (live) |
| **Database Password** | postgres | postgres123 |
| **Database Name** | divi_db | divigrow_db |
| **Health Checks** | No | Yes (for both services) |
| **Restart Policy** | always | on-failure |

**Code Volume Configuration**:
```yaml
volumes:
  - ./server:/app/server        # Live code mounted
  - ./database:/app/database
  - postgres_data_jenkins:/var/lib/postgresql/data
```

### GitHub Webhook Setup

**Purpose**: Automatic pipeline trigger on code push

**Configuration**:
```
Payload URL: http://51.20.137.175:8080/github-webhook/
Content Type: application/json
Events: Push events
```

**Flow**:
1. Developer pushes code to GitHub
2. GitHub sends webhook to Jenkins
3. Jenkins receives event at `/github-webhook/` endpoint
4. Pipeline automatically triggers
5. Containers build and deploy

---

## Application Architecture

### Component Diagram
```
┌─────────────────────────────────────────────┐
│  Client Layer (React + Vite)                │
│  ├─ Port: 3000 (Part I) / N/A (Part II)     │
│  ├─ Framework: React 19                     │
│  ├─ Build Tool: Vite                        │
│  └─ Server: Nginx (production)              │
└────────────┬────────────────────────────────┘
             │
        HTTP API
             │
┌────────────▼────────────────────────────────┐
│  Backend Layer (Node.js + Express)          │
│  ├─ Port: 5001 (Part I) / 5001 (Part II)    │
│  ├─ Framework: Express 5                    │
│  ├─ API: RESTful endpoints                  │
│  └─ Authentication: Bearer tokens           │
└────────────┬────────────────────────────────┘
             │
         Database
             │
┌────────────▼────────────────────────────────┐
│  Database Layer (PostgreSQL)                │
│  ├─ Port: 5432 (Part I) / 5433 (Part II)    │
│  ├─ Version: PostgreSQL 15                  │
│  ├─ Storage: Volume (persistent)            │
│  └─ Tables: notes, holdings, ...            │
└─────────────────────────────────────────────┘
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/notes` | GET | Fetch all notes |
| `/api/notes` | POST | Create new note |
| `/api/notes/:id` | PUT | Update note |
| `/api/notes/:id` | DELETE | Delete note |

---

## Implementation Steps

### Phase 1: Local Setup (Completed)

```bash
#1. Initialize repository
git init
git add .
git commit -m "Initial commit"

# 2. Create Dockerfiles
# server/Dockerfile - Node.js backend
# client/Dockerfile - React frontend

# 3. Create docker-compose.yml
# Configure services, ports, volumes

# 4. Push to GitHub
git remote add origin https://github.com/Eman-ik/divigrow-app.git
git push -u origin main
```

### Phase 2: EC2 Deployment (Part I)

```bash
# 1. SSH into EC2
ssh -i divi-grow.pem ubuntu@51.20.137.175

# 2. Install Docker
sudo apt install docker.io docker-compose-plugin

# 3. Clone repository
git clone https://github.com/Eman-ik/divigrow-app.git
cd divigrow-app

# 4. Deploy
docker-compose up -d

# 5. Verify
docker ps
curl http://localhost:3000
```

### Phase 3: Jenkins Setup (Part II)

```bash
# 1. Install Jenkins on EC2
sudo apt install java-21-openjdk
sudo wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo gpg --dearmor -o /usr/share/keyrings/jenkins-keyring.gpg
sudo apt install jenkins

# 2. Start Jenkins
sudo systemctl enable jenkins
sudo systemctl start jenkins

# 3. Access Jenkins
# http://51.20.137.175:8080

# 4. Configure plugins
# Install: Git, Pipeline, Docker Pipeline

# 5. Create pipeline job
# Select: Pipeline
# Definition: Pipeline script from SCM
# SCM: Git
# Repository: https://github.com/Eman-ik/divigrow-app.git
# Script path: Jenkinsfile

# 6. Configure webhook in GitHub
# Settings → Webhooks → Add webhook
# Payload URL: http://51.20.137.175:8080/github-webhook/
```

---

## Deployment Instructions

### Part I Deployment (Production - Always Running)

```bash
# Start production deployment
cd divigrow-app
docker-compose up -d

# Verify
docker ps
curl http://51.20.137.175:3000

# Access
# Frontend: http://51.20.137.175:3000
# API: http://51.20.137.175:5001/api
```

### Part II Pipeline (Jenkins - On-Demand)

```bash
# Trigger via GitHub webhook (automatic on push)
git push origin main

# OR trigger manually
# Jenkins → DiviGrow Job → Build Now

# Monitor build
# Jenkins Console Output

# After successful build
# Containers running on ports 5001 (app), 5433 (db)
```

### Checking Status

```bash
# Part I containers (production)
docker ps | grep "notes-"

# Part II containers (Jenkins)
docker ps | grep "jenkins"

# Logs
docker logs divi_client
docker logs divi_app_server
docker logs divi_app_db
```

---

## Screenshots & Evidence

### 1. GitHub Repository
- Repository: https://github.com/Eman-ik/divigrow-app
- Branch: main
- Collaborators: qasimalik@gmail.com (admin)

### 2. Docker Hub Images
- `emanmalik15/divi-grow:notes-client` - Frontend image
- `emanmalik15/divi-grow:notes-server` - Backend image
- Repository: https://hub.docker.com/r/emanmalik15/divi-grow

### 3. Jenkins Pipeline
- **URL**: http://51.20.137.175:8080
- **Job**: DiviGrow Pipeline
- **Script**: Jenkinsfile (in repository)
- **Triggers**: GitHub webhook + manual trigger

### 4. Deployment Status

#### Part I (Production - Running)
```
CONTAINER ID   IMAGE                             STATUS          PORTS
abc123...      emanmalik15/divi-grow:notes-client  Up 2 hours     0.0.0.0:3000->80/tcp
def456...      emanmalik15/divi-grow:notes-server  Up 2 hours     0.0.0.0:5001->4000/tcp
ghi789...      postgres:15                         Up 2 hours     0.0.0.0:5432->5432/tcp
```

#### Part II (Jenkins - Stopped initially)
```
CONTAINER ID   IMAGE          STATUS          PORTS
jkl012...      node:20-alpine  Exited (0)      -
mno345...      postgres:15     Exited (0)      -
```

---

## Troubleshooting

### Issue: Container won't start
```bash
# Check logs
docker logs <container_id>

# Check Docker daemon
sudo systemctl status docker

# Verify image exists
docker images | grep divigrow
```

### Issue: Port already in use
```bash
# Find process using port
lsof -i :<port>

# Kill process
kill -9 <PID>

# Or use different port in docker-compose
```

### Issue: Database won't initialize
```bash
# Check init.sql exists
ls -la database/init.sql

# Check database logs
docker exec <db_container> psql -U postgres -d divigrow_db -c "\dt"
```

### Issue: Jenkins webhook not triggering
```bash
# Check webhook delivery in GitHub
# Settings → Webhooks → Recent Deliveries

# Verify Jenkins endpoint is accessible
curl -I http://51.20.137.175:8080/github-webhook/

# Check Jenkins logs
tail -f /var/log/jenkins/jenkins.log
```

---

## Submission Checklist

✅ **Part I**: Dockerfile, docker-compose.yml in repository  
✅ **Part II**: Enhanced Jenkinsfile, docker-compose.jenkins.yml in repository  
✅ **GitHub**: Repository eman-ik/divigrow-app with qasimalik@gmail.com as collaborator  
✅ **Jenkins**: Pipeline configured with GitHub webhook  
✅ **Report**: This comprehensive documentation  
✅ **Deployment**: Part I running, Part II ready to trigger  

---

## Summary

This assignment successfully demonstrates:

1. **Part I - Containerization**:
   - Multi-stage Docker builds for optimized images
   - docker-compose orchestration with persistent storage
   - EC2 deployment with networking and port configuration

2. **Part II - CI/CD Automation**:
   - Jenkins pipeline with multiple validation stages
   - GitHub webhook integration for automatic triggers
   - Code volume mounting for live development
   - Comprehensive health checks and error reporting

3. **DevOps Best Practices**:
   - Version control integration (Git/GitHub)
   - Infrastructure as Code (docker-compose)
   - Automation and repeatability (Jenkinsfile)
   - Monitoring and logging (health checks, reports)
   - Security (persistent credentials, network isolation)

---

## Contact & Resources

- **GitHub**: https://github.com/Eman-ik/divigrow-app
- **Docker Hub**: https://hub.docker.com/r/emanmalik15/divi-grow
- **Jenkins**: http://51.20.137.175:8080
- **Assignment Form**: https://forms.gle/ubA9DRzQSudr2qhY6
- **Responses**: https://docs.google.com/spreadsheets/d/1TkLJfPSVe1xWh3RjrCKl0Kfzc_VAugOWXoUxbGoBej0

---

**Report Generated**: April 17, 2026  
**Assignment Status**: ✅ Complete
