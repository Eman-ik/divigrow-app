# GitHub Webhook Configuration Guide

## What is a GitHub Webhook?
A webhook automatically triggers Jenkins to start a pipeline whenever you push code to GitHub. This enables continuous integration (CI) - code changes automatically trigger builds.

---

## STEP-BY-STEP: Configure GitHub Webhook

### **1. Get Your Jenkins URL**

First, find your Jenkins server URL:
- Jenkins runs on your EC2 instance: `http://51.20.137.175:8080`
- Your Jenkins username and auth token (you'll create these)

---

### **2. Create Jenkins API Token**

1. Open Jenkins: `http://51.20.137.175:8080`
2. Click your **username** (top-right)
3. Click **Configure**
4. Under **API Token** section, click **Add new Token**
5. Name it: `github-webhook-token`
6. Click **Generate**
7. **Copy the token** (you'll use this in GitHub)

Example token: `11a1234b1c1d1e1f1g1h1i1j1k1l1m1`

---

### **3. Add GitHub Collaborator**

**Give your instructor access to trigger pipelines:**

1. Go to GitHub: `https://github.com/Eman-ik/divigrow-app`
2. Click **Settings** → **Collaborators**
3. Click **Add people**
4. Invite: `qasimalik@gmail.com`
5. Give permission: **Admin** (so they can trigger builds and manage settings)
6. They'll receive email invitation

---

### **4. Configure GitHub Webhook**

#### **In GitHub Repository:**

1. Go to `https://github.com/Eman-ik/divigrow-app`
2. Click **Settings**
3. Click **Webhooks** (left menu)
4. Click **Add webhook**

#### **Fill in the form:**

| Field | Value |
|-------|-------|
| **Payload URL** | `http://51.20.137.175:8080/github-webhook/` |
| **Content type** | `application/json` |
| **Secret** | Leave empty (or create one for security) |
| **Events** | Select **Push events** |
| **Active** | ✓ Check this |

5. Click **Add webhook**

#### **Webhook URL Breakdown:**
```
http://51.20.137.175:8080/github-webhook/
└─ Jenkins server IP/URL
                       └─ Your EC2 instance
                                       └─ Jenkins webhook endpoint
```

---

### **5. Test the Webhook**

GitHub will automatically send a test event:

1. In **Webhooks** section, scroll to your new webhook
2. Scroll down to **Recent Deliveries**
3. Click the latest delivery
4. Check **Response** shows `200` (success)
5. If `500` or error, check Jenkins logs

---

### **6. Trigger Pipeline from Code Push**

**Now whenever you push to GitHub, Jenkins builds automatically:**

```bash
# Make a change locally
echo "# Updated" >> README.md

# Push to GitHub
git add README.md
git commit -m "Test webhook trigger"
git push origin main
```

**Jenkins will automatically:**
1. Receive webhook notification from GitHub
2. Check out your code
3. Build Docker containers
4. Deploy on EC2

**Verify the build started:**
- Open Jenkins: `http://51.20.137.175:8080`
- Check **Build History** (left sidebar)
- Click the new build to see logs

---

## Advanced: Jenkins Configuration

### **Install Required Plugins**

If not already installed:

1. Jenkins → **Manage Jenkins** → **Manage Plugins**
2. Available plugins tab
3. Search and install:
   - ✅ **GitHub Integration** plugin
   - ✅ **Pipeline** plugin
   - ✅ **Docker Pipeline** plugin
   - ✅ **Git** plugin

After installing, click **Restart Jenkins**

---

### **Configure Jenkins Git Credentials** (Optional)

If webhooks fail with authentication error:

1. **Manage Jenkins** → **Manage Credentials**
2. Click **System** → **Global credentials**
3. **Add Credentials** → **Username with password**
   - Username: Your GitHub username
   - Password: GitHub Personal Access Token
4. Click **Create**

---

## Troubleshooting Webhooks

### **Problem: Webhook says "pending"**
- **Solution**: GitHub couldn't reach Jenkins
- Check: Can you access `http://51.20.137.175:8080` from internet?
- Check: EC2 Security Group allows port 8080

### **Problem: Jenkins doesn't trigger on push**
- Check Jenkins logs: **Jenkins home** → **logs**
- Check GitHub webhook deliveries: Settings → Webhooks
- Verify payload URL is exactly: `http://51.20.137.175:8080/github-webhook/`

### **Problem: Build fails after webhook trigger**
- Open failed build in Jenkins
- Click **Console Output**
- Look for error messages
- Check Docker container logs:
  ```bash
  docker compose -f docker-compose.jenkins.yml logs
  ```

---

## Summary

✅ **Webhook Flow:**
1. You push code to GitHub
2. GitHub sends webhook notification to Jenkins
3. Jenkins receives webhook at `http://51.20.137.175:8080/github-webhook/`
4. Jenkins triggers pipeline (checks out code, builds, deploys)
5. Pipeline runs docker-compose.jenkins.yml
6. Application deployed on EC2

---

## Important URLs & Credentials

| Item | URL/Value |
|------|-----------|
| **Jenkins** | http://51.20.137.175:8080 |
| **GitHub Repo** | https://github.com/Eman-ik/divigrow-app |
| **Webhook URL** | http://51.20.137.175:8080/github-webhook/ |
| **API Token** | (Generate from Jenkins → Your username → Configure) |
| **Collaborator** | qasimalik@gmail.com |

---

## Manual Build Trigger (Without Webhook)

If you want to manually trigger a build without pushing code:

1. Open Jenkins: `http://51.20.137.175:8080`
2. Click your pipeline job
3. Click **Build Now** (left sidebar)

---

## Next Steps

1. ✅ Create Jenkins API token
2. ✅ Add collaborator to GitHub
3. ✅ Configure GitHub webhook
4. ✅ Test by pushing code
5. ✅ Monitor build in Jenkins
6. ✅ Access deployed application on EC2
