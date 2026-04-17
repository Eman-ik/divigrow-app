# Adding Collaborator to GitHub Repository

## Why Add a Collaborator?

To allow your instructor (qasimalik@gmail.com) to:
- View your code and deployment
- Trigger Jenkins pipeline manually
- Manage repository settings
- Review your implementation

---

## Steps to Add Collaborator

### **1. Go to Your Repository**
- URL: https://github.com/Eman-ik/divigrow-app
- Click on your repository

### **2. Navigate to Settings**
- Click **Settings** tab (right side)

### **3. Open Collaborators**
- Left sidebar → **Collaborators and teams**
- (or **Access** → **Collaborators**)

### **4. Add Collaborator**
- Click **Add people** button
- Type: `qasimalik@gmail.com`

### **5. Choose Permission Level**

| Permission | Ability |
|-----------|---------|
| **Pull** | View only (read-only) |
| **Triage** | Comment and manage issues |
| **Push** | Read + write to branches |
| **Maintain** | Manage branch protections |
| **Admin** | ✅ RECOMMENDED - Full control |

- Select **Admin** permission
- Click **Add qasimalik@gmail.com to divigrow-app**

### **6. Confirmation**
- GitHub sends invitation email to qasimalik@gmail.com
- They accept invitation
- They now appear in **Collaborators** list

---

## Verification

Check if collaborator was added:
1. Go to Settings → Collaborators
2. Confirm `qasimalik@gmail.com` appears in list
3. Verify permission level shows **Admin**

---

## What They Can Now Do

With **Admin** access, they can:
- ✅ Trigger Jenkins pipeline manually
- ✅ View all repositories and branches
- ✅ Review git history and commits
- ✅ Access secrets and deployment configuration
- ✅ Invite other collaborators
- ✅ Delete repository (if needed)

---

## Important Notes

⚠️ **Public Repository**: If your repository is public, anyone can see the code, but only you and collaborators can push changes.

🔒 **Secrets**: Never commit passwords, API keys, or SSH keys to the repository. Use `.env` files or GitHub Secrets for sensitive data.

---

## GitHub & Jenkins Integration

After adding collaborator, when they trigger the Jenkins pipeline:

1. They go to Jenkins: http://51.20.137.175:8080
2. Navigate to DiviGrow pipeline job
3. Click **Build Now** (or push code)
4. Jenkins automatically:
   - Checks out code from GitHub
   - Validates configuration
   - Builds Docker containers
   - Deploys to EC2
   - Runs health checks

---

## Troubleshooting

### **Invitation not received**
- Check spam folder
- Check email typed correctly: `qasimalik@gmail.com`
- Resend invitation from GitHub

### **Collaborator can't trigger Jenkins**
- Verify they're in collaborators list (GitHub)
- Check Jenkins security configuration allows GitHub webhooks
- Ensure Jenkins GitHub plugin is installed

---

**Next Step**: Once collaborator is added, your assignment is ready for review!
