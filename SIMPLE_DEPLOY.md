# ⚡ Simple Deployment Guide

Three steps to get your app online.

### Step 1: Create Repository
1. Go to **GitHub.com** and create a **New Repository**.
2. Name it `Polyclinic`.
3. **Copy the HTTPS URL** (it looks like `https://github.com/.../Polyclinic.git`).

### Step 2: Upload Code (PC)
1. Double-click **`connect_to_github.bat`** in your project folder.
2. Paste the URL when asked.
3. Wait for it to say "SUCCESS".

### Step 3: Launch on Server
Log into your server and **COPY & PASTE** this entire block at once:

```bash
# 1. Download Code (Replace URL!)
git clone <PASTE_YOUR_GITHUB_URL_HERE> Polyclinic
cd Polyclinic

# 2. Configure Secrets (Copy this EXACTLY)
echo "EMAIL_USER=polyclinic977@gmail.com" > .env
echo "EMAIL_PASS=uxck ydkc gxge zzhm" >> .env
echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env

# 3. Start Server
chmod +x server_update.sh
./server_update.sh
```

**That's it!**

---

### How to Update Later?
1. **PC**: Double-click `connect_to_github.bat` again.
2. **Server**: Run `cd Polyclinic && ./server_update.sh`.
