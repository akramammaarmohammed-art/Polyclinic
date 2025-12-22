# 🚀 Deployment Guide: GitHub to Server

This guide explains how to upload your code to GitHub and then "link" your server to it so it pulls updates automatically.

---

## **PHASE 1: Local Setup (Windows)**

1.  **Run the Setup Script**
    *   Double-click `git_setup.bat`.
    *   This will initialize git and commit your current files.

2.  **Upload to GitHub**
    *   Go to **GitHub.com** and create a **New Repository** (name it `Polyclinic`).
    *   **Do not** add a README or .gitignore (we already have them).
    *   Copy the **HTTPS URL** of your new repo.
    *   Open a terminal in your project folder and run:
        ```cmd
        git remote add origin https://github.com/YOUR_USERNAME/Polyclinic.git
        git push -u origin main
        ```

---

## **PHASE 2: Server Setup (Old Server)**

Connect to your server (via SSH or Console) and run these commands:

### 1. Install Git
```bash
sudo apt update
sudo apt install git python3-venv python3-pip -y
```

### 2. Clone the Repository
Replace the URL with your GitHub URL:
```bash
cd /root
git clone https://github.com/YOUR_USERNAME/Polyclinic.git
cd Polyclinic
```

### 3. Restore the Secrets (.env)
Since `.env` was hidden for security, you must recreate it on the server manually.
```bash
nano .env
```
Paste this inside (Right-click to paste):
```ini
EMAIL_USER=polyclinic977@gmail.com
EMAIL_PASS=uxck ydkc gxge zzhm
SECRET_KEY=generate_security_key_here
```
Press `Ctrl+O`, `Enter` to save, then `Ctrl+X` to exit.

### 4. Run the Server
Use the included helper script:
```bash
chmod +x server_update.sh
./server_update.sh
```

---

## **PHASE 3: How to Update in Future**

When you make changes on your computer:

1.  **On PC**:
    ```cmd
    git add .
    git commit -m "Fixed something"
    git push
    ```

2.  **On Server**:
    ```bash
    cd /root/Polyclinic
    ./server_update.sh
    ```
    *(This script will auto-pull the new code, update libraries, and restart the app)*
