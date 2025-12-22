# Polyclinic Management System

A unified Healthcare Management System built with **FastAPI** (Backend) and **Vanilla JS** (Frontend).

## Features
- **Role-based Access:** Patients, Doctors, Receptionists, Senior Admins.
- **Appointments:** Booking flow with email OTP verification.
- **Guest Booking:** Book without an account (guests).
- **Messaging:** Internal chat system for staff.
- **Availability:** Doctors manage their own schedules.

## Setup Instructions

### Prerequisites
- Python 3.9+
- Pip

### Installation
1.  Clone the repository.
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Running Locally
To start the server:
```bash
uvicorn main:app --reload --port 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

## Deployment (Cloud)
This project is ready for deployment on DigitalOcean/AWS/Linode.
- **Database:** SQLite (Automatic creation `polyclinic.db`)
- **Email:** Supports SMTP (Gmail). If ports are blocked, it falls back to Mock Mode (logs OTP to console).

## Configuration
Create a `.env` file (see `.env.example`) with:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
SECRET_KEY=secure-random-key
```
