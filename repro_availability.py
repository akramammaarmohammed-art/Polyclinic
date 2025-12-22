import requests
import datetime

API_URL = "http://127.0.0.1:8000"

def run_test():
    # 1. Login as Admin to create a temp doctor
    s = requests.Session()
    login = s.post(f"{API_URL}/auth/login", data={"username": "admin", "password": "admin123"})
    if login.status_code != 200:
        print("Admin login failed")
        return
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a new unique doctor
    doc_user = f"tempdoc_{datetime.datetime.now().timestamp()}"
    print(f"Creating doctor: {doc_user}")
    doc_payload = {
        "username": doc_user,
        "password": "password123",
        "name": "Temp Doctor",
        "specialization": "Tester"
    }
    r = s.post(f"{API_URL}/admin/doctors", json=doc_payload, headers=headers)
    if r.status_code != 200:
        print(f"Failed to create doctor: {r.text}")
        return
    
    # Get Doctor ID
    # We need to list doctors to find the ID
    r = s.get(f"{API_URL}/admin/doctors", headers=headers)
    doctors = r.json()
    print(f"Doctors found: {doctors}")
    # Endpoint returns DoctorOut schema: {doctor_id, name, specialization}
    # We created with name="Temp Doctor"
    # But names might not be unique. Use the latest one.
    doc_id = doctors[-1]['id'] # Assuming ID is strictly increasing and we just added one
    print(f"Doctor ID: {doc_id}")

    # 3. Create a Patient
    pat_user = f"temppat_{datetime.datetime.now().timestamp()}"
    s.post(f"{API_URL}/auth/signup", json={"username": pat_user, "password": "password123", "role": "Customer"})
    
    # Login as Patient
    login = s.post(f"{API_URL}/auth/login", data={"username": pat_user, "password": "password123"})
    pat_token = login.json()["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_token}"}

    # 4. Try to Book (Should Succeed - Default Open)
    print("\nTest 1: Booking with NO availability set (Expect Success)")
    booking_payload = {
        "doctor_id": doc_id,
        "visit_date": datetime.date.today().isoformat(),
        "time_slot": "10:00:00",
        "gender": "Male",
        "visit_type": "Consultation"
    }
    r = s.post(f"{API_URL}/visits", json=booking_payload, headers=pat_headers)
    print(f"Status: {r.status_code}, Response: {r.text}")

    # 5. Login as Doctor to add availability
    login = s.post(f"{API_URL}/auth/login", data={"username": doc_user, "password": "password123"})
    doc_token = login.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}
    
    # Add availability for TODAY but at 2 PM only
    today_idx = datetime.date.today().weekday()
    print(f"\nAdding availability for Day {today_idx} at 14:00 - 15:00")
    avail_payload = [{
        "day_of_week": today_idx,
        "start_time": "14:00:00",
        "end_time": "15:00:00",
        "max_patients_per_slot": 5
    }]
    r = s.post(f"{API_URL}/doctor/me/availability", json=avail_payload, headers=doc_headers)
    print(f"Add Availability Status: {r.status_code}")

    # 6. Try to Book 10:00 AM again (Should FAIL - Strict Mode)
    print("\nTest 2: Booking 10 AM after adding 2 PM slot (Expect Failure)")
    r = s.post(f"{API_URL}/visits", json=booking_payload, headers=pat_headers)
    print(f"Status: {r.status_code}, Response: {r.text}")

    # 7. Try to Book 2:00 PM (Should Succeed)
    print("\nTest 3: Booking 2 PM (Inside Slot) (Expect Success)")
    booking_payload["time_slot"] = "14:00:00"
    r = s.post(f"{API_URL}/visits", json=booking_payload, headers=pat_headers)
    print(f"Status: {r.status_code}, Response: {r.text}")

    # Cleanup
    print("\nCleaning up...")
    s.delete(f"{API_URL}/admin/doctors/{doc_id}", headers=headers)

if __name__ == "__main__":
    run_test()
