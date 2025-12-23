//const API_URL = "http://127.0.0.1:8000"; 
const API_URL = "";
console.log("APP.JS LOADED (v35)");


// --- State ---
const state = {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    username: localStorage.getItem('username'),
    currentCalendarDate: new Date() // Added for Calendar View
};

function getTimeOptions() {
    let options = '';
    // 8 AM to 10 PM (22)
    for (let i = 8; i < 22; i++) {
        // Value must be HH:MM:00 (24h) for backend
        const h = i < 10 ? '0' + i : i;
        const value = `${h}:00:00`;

        // Label logic
        let startH = i;
        let endH = i + 1;
        let startAm = startH < 12 ? 'AM' : 'PM';
        let endAm = endH < 12 ? 'AM' : 'PM'; // Though 12 is PM

        if (startH > 12) startH -= 12;
        if (endH > 12) endH -= 12;
        if (endH === 12 && i !== 11) endAm = 'PM'; // 12 PM
        if (endH === 12 && i === 23) endAm = 'AM'; // Midnight edge case (not needed here)

        // 12 PM fix
        if (i === 12) startAm = 'PM';

        const label = `${startH} ${startAm} - ${endH} ${endAm}`;

        options += `<option value="${value}">${label}</option>`;
    }
    return options;
}



// --- Time Helpers ---
// --- Time Helpers ---
function formatLocalTime(isoStr) {
    if (!isoStr) return '';
    try {
        const date = new Date(isoStr);
        if (isNaN(date.getTime())) {
            // Handle "HH:MM" string case (DB Corruption fallback)
            // Assume it is UTC time string
            const timeMatch = isoStr.match(/^(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                let h = parseInt(timeMatch[1]);
                const m = parseInt(timeMatch[2]);
                // Add 4h (UTC -> Local)
                h += 4;
                if (h >= 24) h -= 24;
                const ampm = h >= 12 ? 'PM' : 'AM';
                let hDisp = h % 12;
                if (hDisp === 0) hDisp = 12;
                const mDisp = m < 10 ? '0' + m : m;
                return `${hDisp}:${mDisp} ${ampm}`;
            }
            return isoStr;
        }

        // Manual UTC+4 Conversion
        let hours = date.getUTCHours() + 4;
        if (hours >= 24) hours -= 24;
        const minutes = date.getUTCMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        let hDisp = hours % 12;
        if (hDisp === 0) hDisp = 12;
        const mDisp = minutes < 10 ? '0' + minutes : minutes;

        return `${hDisp}:${mDisp} ${ampm}`;
    } catch (e) { return isoStr; }
}

function formatSmartTime(isoStr) {
    if (!isoStr) return '';
    try {
        const date = new Date(isoStr);
        if (isNaN(date.getTime())) {
            const timeMatch = isoStr.match(/^(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                // Reuse formatLocalTime logic for simple display
                return formatLocalTime(isoStr);
            }
            return isoStr;
        }

        // Manual UTC+4 for Smart Time implies checking "Today" in UTC+4 terms
        // 1. Get current time in UTC
        const now = new Date();
        const nowH = now.getUTCHours() + 4;
        // This simple "Today" check is tricky with manual rollover. 
        // Let's simplify: Just always show Date + Time to avoid "Today" logic bugs in manual math
        // Or reconstruct a shifted date object to compare dates.

        const shiftedDate = new Date(date.getTime() + (4 * 60 * 60 * 1000));
        const shiftedNow = new Date(now.getTime() + (4 * 60 * 60 * 1000));

        if (shiftedDate.getUTCDay() === shiftedNow.getUTCDay() &&
            Math.abs(shiftedNow - shiftedDate) < 24 * 60 * 60 * 1000) {
            return formatLocalTime(isoStr);
        } else {
            // Return Date DD/MM
            const d = shiftedDate.getUTCDate();
            const m = shiftedDate.getUTCMonth() + 1;
            return `${d}/${m}`;
        }
    } catch (e) { return isoStr; }
}

// --- DOM Elements ---
const app = document.getElementById('app');

// --- Auth Functions ---
function toggleAuth(mode) {
    document.getElementById('login-form').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('signup-form').style.display = mode === 'signup' ? 'block' : 'none';
    document.getElementById('alert-box').style.display = 'none';
}

async function signup(username, password) {
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                role: 'Customer'
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail);
        }

        showAlert("Account created! Please login.", 'success');
        toggleAuth('login');
    } catch (err) {
        showAlert(err.message, 'error');
    }
}

async function login(username, password) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Invalid credentials');
        }

        const data = await response.json();
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));

        state.token = data.access_token;
        // Map backend 'Customer' to frontend 'Patient' or keep as Customer
        state.role = payload.role;
        state.username = payload.display_name || payload.sub;

        localStorage.setItem('token', state.token);
        localStorage.setItem('role', state.role);
        localStorage.setItem('username', state.username);

        renderDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    state.token = null;
    state.role = null;
    state.username = null;
    location.reload();
}

// --- UI Functions ---
function showAlert(message, type) {
    const alertBox = document.getElementById('alert-box');
    if (alertBox) {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'block';
    } else {
        alert(message);
    }
}


function renderDashboard() {
    // Customize sidebar based on role
    let navLinks = `
        <a href="#" id="nav-home" class="nav-link" onclick="loadView('home')">Home</a>
    `;

    if (state.role === 'Senior Admin') {
        navLinks += `
            <a href="#" id="nav-doctors" class="nav-link" onclick="loadView('doctors')">Manage Doctors</a>
            <a href="#" id="nav-staff" class="nav-link" onclick="loadView('staff')">Manage Staff</a>
            <a href="#" id="nav-book" class="nav-link" onclick="loadView('book')">Book Appointment</a>
            <a href="#" id="nav-all-schedule" class="nav-link" onclick="loadView('all-schedule')">Master Schedule</a>
            <a href="#" id="nav-check-availability" class="nav-link" onclick="loadView('check-availability')">Check Availability</a>
            <a href="#" id="nav-msgs" class="nav-link" onclick="loadMessagesView()">Messages <span id="msg-badge" style="background:red; color:white; border-radius:10px; padding:2px 6px; font-size:0.7rem; display:none;">0</span></a>
        `;
    } else if (state.role === 'Receptionist') {
        navLinks += `
            <a href="#" id="nav-book" class="nav-link" onclick="loadView('book')">Book Appointment</a>
            <a href="#" id="nav-all-schedule" class="nav-link" onclick="loadView('all-schedule')">Master Schedule</a>
            <a href="#" id="nav-check-availability" class="nav-link" onclick="loadView('check-availability')">Check Availability</a>
            <a href="#" id="nav-msgs" class="nav-link" onclick="loadMessagesView()">Messages <span id="msg-badge" style="background:red; color:white; border-radius:10px; padding:2px 6px; font-size:0.7rem; display:none;">0</span></a>
        `;
    } else if (state.role === 'Doctor') {
        navLinks += `
            <a href="#" id="nav-my-schedule" class="nav-link" onclick="loadView('my-schedule')">My Appointments</a>
            <a href="#" id="nav-doctor-availability" class="nav-link" onclick="loadView('doctor-availability')">Manage Availability</a>
            <a href="#" id="nav-msgs" class="nav-link" onclick="loadMessagesView()">Messages <span id="msg-badge" style="background:red; color:white; border-radius:10px; padding:2px 6px; font-size:0.7rem; display:none;">0</span></a>
        `;
    } else { // Customer
        navLinks += `
            <a href="#" id="nav-book" class="nav-link" onclick="loadView('book')">Book Appointment</a>
            <a href="#" id="nav-my-schedule" class="nav-link" onclick="loadView('my-schedule')">My Appointments</a>
        `;
    }

    app.innerHTML = `
        <div class="dashboard">
            <div class="mobile-header">
                <h3>Polyclinic</h3>
                <button class="btn-menu" onclick="toggleSidebar()">☰ Menu</button>
            </div>
            <aside class="sidebar" id="sidebar">
                <div style="margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:1rem;">
                    <h3>${state.role} Panel</h3>
                    <p style="font-size:0.9rem; color:#666">Logged in as: <strong>${state.username || 'User'}</strong></p>
                </div>
                <nav>
                    ${navLinks}
                    <a href="#" class="nav-link" onclick="logout()" style="color: var(--danger-color)">Logout</a>
                </nav>
            </aside>
            <main class="content" id="main-content">
                <h2>Welcome, ${state.username || state.role}</h2>
                <p>Select an option from the menu.</p>
            </main>
            <div class="overlay" onclick="toggleSidebar()"></div> 
        </div>
    `;

    // Load home by default
    loadView('home');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.querySelector('.overlay').classList.toggle('active');
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("App Init: State", state);
        // If token exists, show dashboard, else show landing
        if (state.token) {
            renderDashboard();
        } else {
            console.log("Guest mode, loading landing");
            if (typeof renderLanding === 'function') {
                renderLanding();
            } else {
                console.error("renderLanding is not defined!");
                document.getElementById('app').innerHTML = `
                    <div style="padding:20px; text-align:center;">
                        <h1>Error Loading Application</h1>
                        <p>Please refresh the page.</p>
                    </div>
                `;
            }
        }

        // V3 Startups
        if (typeof initChatWidget === 'function') initChatWidget();
        // Custom Guest Chat
        initGuestChat();
        if (state.token && typeof startMessagePolling === 'function') startMessagePolling();

    } catch (e) {
        console.error("Init Error:", e);
        showToast("App Error: " + e.message, 'error');
    }
});

// --- Event Handlers ---
function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    login(u, p);
}

// Signup handler if needed (for later)
function handleSignup(e) {
    e.preventDefault();
    const u = document.getElementById('s-username').value;
    const p = document.getElementById('s-password').value;
    signup(u, p);
}

// --- API Helper ---
async function authFetch(url, options = {}) {
    const headers = {
        'Authorization': `Bearer ${state.token}`,
        ...options.headers
    };

    // Auto-detect Content-Type for JSON
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout();
        return null;
    }
    return response;
}

// --- View Logic ---
function updateSidebarActive(viewName) {
    // Remove active class from all
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    // Add to current
    const el = document.getElementById('nav-' + viewName);
    if (el) el.classList.add('active');
}

async function loadView(viewName) {
    updateSidebarActive(viewName);
    const content = document.getElementById('main-content');

    // Clear Content
    content.innerHTML = '<p>Loading...</p>';

    if (viewName === 'home') {
        const res = await authFetch('/stats/dashboard');
        let stats = {};
        if (res.ok) stats = await res.json();

        content.innerHTML = `<h2> Dashboard</h2> `;

        let widgets = `<div class="dashboard-grid"> `;

        if (state.role === 'Senior Admin') {
            widgets += `
                <div class="stat-card">
                    <h3>Total Doctors</h3>
                    <p class="stat-num">${stats.total_doctors || 0}</p>
                </div>
                <div class="stat-card">
                    <h3>Receptionists</h3>
                    <p class="stat-num">${stats.total_staff || 0}</p>
                </div>
                <div class="stat-card">
                    <h3>Total Patients</h3>
                    <p class="stat-num">${stats.total_patients || 0}</p>
                </div>
                <div class="stat-card">
                    <h3>Total Appts (All Time)</h3>
                    <p class="stat-num">${stats.total_visits || 0}</p>
                </div>
                <div class="stat-card" onclick="exportCSV()" style="cursor:pointer; background:#e0f2fe; border:1px solid #7dd3fc">
                    <h3>Export Data</h3>
                    <p>Download CSV</p>
                </div>
            `;
        } else if (state.role === 'Doctor') {
            widgets += `
                <div class="stat-card">
                    <h3>Appointments Today</h3>
                    <p class="stat-num">${stats.today_appointments || 0}</p>
                </div>
                <div class="stat-card">
                    <h3>Upcoming Appointments</h3>
                    <p class="stat-num">${stats.upcoming_appointments || 0}</p>
                </div>
                <div class="stat-card">
                    <h3>Next Appointment</h3>
                    <p class="stat-text">${stats.next_appointment || 'None'}</p>
                </div>
            `;
        } else if (state.role === 'Receptionist') {
            widgets += `
                <div class="stat-card">
                    <h3>Today's Visits</h3>
                    <p class="stat-num">${stats.today_total_visits || 0}</p>
                </div>
                <div class="stat-card">
                    <h3>Upcoming Visits (Total)</h3>
                    <p class="stat-num">${stats.upcoming_visits || 0}</p>
                </div>
            `;
        } else if (state.role === 'Customer') { // Patient
            widgets += `
                <div class="stat-card">
                    <h3>Next Appointment</h3>
                    <p class="stat-text">${stats.next_visit || 'No upcoming visits'}</p>
                    ${stats.next_doctor ? `<p>with ${stats.next_doctor}</p>` : ''}
                </div>
                `;
        }

        widgets += `</div>
            <div class="card" style="margin-top:20px;">
                <h3>Patient Search</h3>
                <input type="text" id="patient-search" onkeyup="filterPatients()" placeholder="Search patients by name..." style="padding:10px; width:100%; border:1px solid #ddd; border-radius:4px;">
                <div id="search-results"></div>
            </div>
            <div style="margin-top:20px;">
                <h3>Welcome, ${state.username || state.role}</h3>
                <p>Select an option from the sidebar to manage the clinic.</p>
            </div>
            `;

        content.innerHTML = widgets;
    }
    // --- Landing & Auth ---
    else if (viewName === 'doctors') {
        if (state.role !== 'Senior Admin') return content.innerHTML = '<p>Access Denied</p>';

        // Fetch doctors
        const res = await authFetch('/admin/doctors');
        const doctors = await res.json();

        let html = `
                <h2> Manage Doctors</h2>
            <div class="card">
                <h3>Add New Doctor</h3>
                <form id="add-doctor-form">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" id="doc-name" required>
                    </div>
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="doc-user" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="doc-pass" required>
                    </div>
                    <div class="form-group">
                        <label>Specialization</label>
                        <input type="text" id="doc-spec" required>
                    </div>
                    <button type="submit" class="btn">Create Doctor</button>
                    <div id="doc-msg" style="margin-top:10px"></div>
                </form>
            </div>

            <h3>Existing Doctors</h3>
            <table>
                <thead><tr><th>Name</th><th>Specialization</th><th>Action</th></tr></thead>
                <tbody>
                    ${doctors.map(d => `<tr>
                        <td>${d.name}</td>
                        <td>${d.specialization}</td>
                        <td><button class="btn" style="background:var(--danger-color);padding:5px 10px;font-size:0.8rem" onclick="deleteDoctor(${d.id})">Remove</button></td>
                    </tr>`).join('')}
                </tbody>
            </table>
            `;
        content.innerHTML = html;

        document.getElementById('add-doctor-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                username: document.getElementById('doc-user').value,
                password: document.getElementById('doc-pass').value,
                name: document.getElementById('doc-name').value,
                specialization: document.getElementById('doc-spec').value
            };

            const postRes = await authFetch('/admin/doctors', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (postRes.ok) {
                document.getElementById('doc-msg').innerText = "Doctor Created!";
                document.getElementById('doc-msg').style.color = "green";
                setTimeout(() => loadView('doctors'), 1000);
            } else {
                const err = await postRes.json();
                document.getElementById('doc-msg').innerText = "Error: " + err.detail;
                document.getElementById('doc-msg').style.color = "red";
            }
        });
    }
    else if (viewName === 'book') {
        // Fetch doctors for dropdown
        const res = await authFetch('/admin/doctors');
        const doctors = await res.json();

        let html = `
                <h2> Book Appointment</h2>
                    <div class="card">
                        <form id="book-form">
                            <div class="form-group">
                                <label>Doctor</label>
                                <select id="visit-doc" onchange="updateAdminTimeSlots()" required>
                                    <option value="">Select Doctor</option>
                                    ${doctors.map(d => `<option value="${d.id}">${d.name} (${d.specialization})</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Date</label>
                                <input type="date" id="visit-date" min="${new Date().toISOString().split('T')[0]}" onchange="updateAdminTimeSlots()" required>
                            </div>
                            <div class="form-group">
                                <label>Time Slot</label>
                                <select id="visit-time" required disabled>
                                    <option value="">Select Doctor & Date First</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Gender</label>
                                <select id="visit-gender">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Type</label>
                                <select id="visit-type">
                                    <option value="Consultation">Consultation</option>
                                    <option value="Follow_up">Follow Up</option>
                                    <option value="Emergency">Emergency</option>
                                </select>
                            </div>
                            <button type="submit" class="btn">Check & Book</button>
                            <div id="book-msg" style="margin-top:10px"></div>
                        </form>
                    </div>
            `;
        content.innerHTML = html;

        document.getElementById('book-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const tVal = document.getElementById('visit-time').value;
            const timeSlot = tVal.split(':').length === 2 ? tVal + ":00" : tVal;

            const payload = {
                doctor_id: document.getElementById('visit-doc').value,
                visit_date: document.getElementById('visit-date').value,
                time_slot: timeSlot,
                gender: document.getElementById('visit-gender').value,
                visit_type: document.getElementById('visit-type').value
            };

            const postRes = await authFetch('/visits', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const result = await postRes.json();
            const msgBox = document.getElementById('book-msg');

            if (postRes.ok) {
                msgBox.innerText = "Success: " + result.message;
                msgBox.style.color = "green";
                // setTimeout(() => loadView('home'), 1500); 
            } else {
                msgBox.innerText = result.detail || "Error";
                msgBox.style.color = "red";
            }
        });
    }
    else if (viewName === 'my-schedule') {
        const endpoint = state.role === 'Doctor' ? '/doctor/me/schedule' : '/my/appointments';

        const res = await authFetch(endpoint);
        if (!res.ok) return content.innerHTML = '<p>Error loading schedule. (Feature only for Doctors/Patients)</p>';
        const visits = await res.json();

        let headers = '';
        let rows = '';

        if (state.role === 'Doctor') {
            headers = '<tr><th>Date</th><th>Time</th><th>Patient</th><th>Type</th><th>Actions</th></tr>';
            rows = visits.map(v => `<tr>
                <td>${v.visit_date}</td>
                <td>${v.time_slot}</td>
                <td>${v.patient_name || 'N/A'}</td>
                <td>${v.visit_type}</td>
                <td><button class="btn btn-secondary" onclick="openNotes(${v.visit_id})" style="padding:2px 8px; font-size:0.8rem">Notes</button></td>
            </tr> `).join('');

            // Clean View: Only Appointments
            content.innerHTML = `
                <h2> My Appointments</h2>
                <h3>Upcoming Appointments</h3>
                <table><thead>${headers}</thead><tbody>${rows}</tbody></table>
            `;
            return; // Exit here for doctor

            document.getElementById('avail-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                // Inputs are now HH:MM from dropdown, but backend handles HH:MM:SS strict.
                // Our safe append logic is still good to keep.
                const sVal = document.getElementById('av-start').value;
                const eVal = document.getElementById('av-end').value;

                const sTime = sVal.split(':').length === 2 ? sVal + ":00" : sVal;
                const eTime = eVal.split(':').length === 2 ? eVal + ":00" : eVal;

                const payload = [{
                    day_of_week: parseInt(document.getElementById('av-day').value),
                    start_time: sTime,
                    end_time: eTime,
                    max_patients_per_slot: 10
                }];

                const pRes = await authFetch('/doctor/me/availability', { method: 'POST', body: JSON.stringify(payload) });
                if (pRes.ok) alert("Availability Added!");
                else {
                    const err = await pRes.json();
                    alert("Error: " + (err.detail || "Unknown error"));
                }
            });
            return; // Exit here for doctor

        } else {
            headers = '<tr><th>Date</th><th>Time</th><th>Doctor</th><th>Type</th><th>Action</th></tr>';
            rows = visits.map(v => `<tr>
                <td>${v.visit_date}</td>
                <td>${v.time_slot}</td>
                <td>${v.doctor_name || 'Dr. ' + v.doctor_id}</td>
                <td><span class="badge badge-confirmed">${v.visit_type}</span></td>
                <td><button class="btn" style="background:var(--danger-color);padding:5px 10px;font-size:0.8rem" onclick="cancelMyVisit(${v.visit_id})">Cancel</button></td>
            </tr> `).join('');
        }

        let html = `
                <h2> My Appointments</h2>
                    <table>
                        <thead>${headers}</thead>
                        <tbody>${rows}</tbody>
                    </table>
            `;
        content.innerHTML = html;
    }
    else if (viewName === 'doctor-availability') {
        // ... (existing code) ...
        // Fetch existing availability
        let availList = [];
        const avRes = await authFetch('/doctor/me/availability');
        // ... (rest of function omitted for brevity, but I need to make sure I don't cut it off)
        // Actually, I should just replace the block I am touching.

        // Helper for cancellation
        window.cancelMyVisit = async function (visitId) {
            if (!(await showConfirm("Are you sure you want to cancel this appointment?"))) return;

            const res = await authFetch('/visits/' + visitId, {
                method: 'DELETE'
            });

            if (res.ok) {
                showToast("Appointment Cancelled", "success");
                loadView('my-schedule');
            } else {
                const err = await res.json();
                showToast("Error: " + (err.detail || "Failed to cancel"), "error");
            }
        };
        if (avRes.ok) availList = await avRes.json();

        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const isDefaultOpen = availList.length === 0;

        let tableRows = '';

        for (let i = 0; i < 7; i++) {
            const dayName = days[i];
            const daySlots = availList.filter(a => a.day_of_week === i);

            if (daySlots.length > 0) {
                // Strict Mode for this day
                const slotStr = daySlots.map(s => `
                <div style="margin-bottom:5px;">
                    ${s.start_time} - ${s.end_time}
            <button class="btn" style="background:var(--danger-color);padding:2px 5px;font-size:0.7rem; margin-left:5px;" onclick="deleteSlot(${s.id})">Remove</button>
                    </div>
                `).join('');

                tableRows += `
                <tr>
                        <td>${dayName}</td>
                        <td>${slotStr}</td>
                        <td>
                            <button class="btn" style="padding:2px 5px; font-size:0.8rem;" onclick="setFormDay(${i})">Add More</button>
                        </td>
                    </tr>
                `;
            } else {
                // Open Mode for this day
                tableRows += `
                <tr>
                        <td>${dayName}</td>
                        <td><span style="color:green; font-weight:bold;">Fully Available (08:00 - 22:00)</span></td>
                        <td>
                            <button class="btn" style="padding:2px 5px; font-size:0.8rem; background:var(--primary-color)" onclick="setFormDay(${i})">Customize</button>
                        </td>
                    </tr>
                `;
            }
        }

        content.innerHTML = `
                <h2> Manage Availability</h2>
            
            <div class="card">
                <h3>Weekly Schedule (Mon-Sun)</h3>
                <p style="font-size:0.9rem; color:#666; margin-bottom:10px;">
                    ${isDefaultOpen ? "You have no custom usage set. You are available all day (8 AM - 10 PM)." : "You are in <strong>Strict Mode</strong>. You are only available during the times listed below."}
                </p>
                <table>
                    <thead><tr><th>Day</th><th>Status / Slots</th><th>Action</th></tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
             </div>
            
            <div class="card" id="add-slot-card">
                <h3>Add Availability Slot</h3>
                <form id="avail-form">
                    <div class="form-group"><label>Day</label>
                        <select id="av-day" required>
                            <option value="0">Monday</option>
                            <option value="1">Tuesday</option>
                            <option value="2">Wednesday</option>
                            <option value="3">Thursday</option>
                            <option value="4">Friday</option>
                            <option value="5">Saturday</option>
                            <option value="6">Sunday</option>
                        </select>
                    </div>
                    <div class="form-group"><label>Start Time</label><input type="time" id="av-start" required></div>
                    <div class="form-group"><label>End Time</label><input type="time" id="av-end" required></div>
                    <button type="submit" class="btn">Add Slot</button>
                    <div id="av-msg" style="margin-top:10px"></div>
                </form>
            </div>
            
            <div class="card" style="border-top: 4px solid var(--danger-color)">
                <h3>Manage Time Off / Exceptions</h3>
                <p>Select a date to mark as "Day Off".</p>
                <form id="exception-form">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="ex-date" min="${new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <button type="submit" class="btn" style="background:var(--danger-color)">Mark as Day Off</button>
                    <div id="ex-msg" style="margin-top:10px"></div>
                </form>
            </div>
            `;

        document.getElementById('exception-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const date = document.getElementById('ex-date').value;

            const payload = {
                exception_date: date,
                status: 'Cancelled'
            };

            const res = await authFetch('/doctor/me/exceptions', { method: 'POST', body: JSON.stringify(payload) });
            if (res.ok) {
                document.getElementById('ex-msg').innerText = "Day marked as off!";
                document.getElementById('ex-msg').style.color = "green";
            } else {
                const err = await res.json();
                document.getElementById('ex-msg').innerText = "Error: " + err.detail;
                document.getElementById('ex-msg').style.color = "red";
            }
        });

        document.getElementById('avail-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const sVal = document.getElementById('av-start').value;
            const eVal = document.getElementById('av-end').value;

            const sTime = sVal.split(':').length === 2 ? sVal + ":00" : sVal;
            const eTime = eVal.split(':').length === 2 ? eVal + ":00" : eVal;

            const payload = [{
                day_of_week: parseInt(document.getElementById('av-day').value),
                start_time: sTime,
                end_time: eTime,
                max_patients_per_slot: 10
            }];

            const pRes = await authFetch('/doctor/me/availability', { method: 'POST', body: JSON.stringify(payload) });
            if (pRes.ok) {
                document.getElementById('av-msg').innerText = "Availability Added!";
                document.getElementById('av-msg').style.color = "green";
                setTimeout(() => loadView('doctor-availability'), 1000);
            } else {
                const err = await pRes.json();
                document.getElementById('av-msg').innerText = "Error: " + (err.detail || "Unknown error");
                document.getElementById('av-msg').style.color = "red";
            }
        });
    }
    else if (viewName === 'all-schedule') {
        content.innerHTML = `
                <h2> Master Schedule</h2>
            <div class="card">
                <div class="form-group">
                    <label>Select Date</label>
                    <input type="date" id="sched-date" value="${new Date().toISOString().split('T')[0]}" min="${new Date().toISOString().split('T')[0]}" onchange="loadMasterSchedule(this.value)">
                </div>
            </div>
            <div id="schedule-results"></div>
            `;
        // Load default
        loadMasterSchedule(document.getElementById('sched-date').value);
    }
    else if (viewName === 'staff') {
        if (state.role !== 'Senior Admin') return content.innerHTML = '<p>Access Denied</p>';

        // Fetch existing staff
        const res = await authFetch('/admin/staff');
        let staffList = [];
        if (res.ok) staffList = await res.json();

        let html = `
                <h2> Manage Staff</h2>
            <div class="card">
                <h3>Create Receptionist</h3>
                <form id="add-staff-form">
                    <div class="form-group"><label>Username</label><input type="text" id="st-user" required></div>
                    <div class="form-group"><label>Password</label><input type="password" id="st-pass" required></div>
                    <button type="submit" class="btn">Create</button>
                    <div id="st-msg" style="margin-top:10px"></div>
                </form>
            </div>

            <h3>Existing Receptionists</h3>
            <table>
                <thead><tr><th>ID</th><th>Username</th><th>Action</th></tr></thead>
                <tbody>
                    ${staffList.length > 0 ? staffList.map(s => `<tr>
                        <td>${s.id}</td>
                        <td>${s.username}</td>
                        <td><button class="btn" style="background:var(--danger-color);padding:5px 10px;font-size:0.8rem" onclick="deleteStaff(${s.id})">Remove</button></td>
                    </tr>`).join('') : '<tr><td colspan="3">No receptionists found</td></tr>'}
                </tbody>
            </table>
            `;
        content.innerHTML = html;

        document.getElementById('add-staff-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                username: document.getElementById('st-user').value,
                password: document.getElementById('st-pass').value,
                role: 'Receptionist'
            };

            const postRes = await authFetch('/admin/users', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (postRes.ok) {
                document.getElementById('st-msg').innerText = "Receptionist Created!";
                document.getElementById('st-msg').style.color = "green";
                setTimeout(() => loadView('staff'), 1000); // Reload to show in list
            } else {
                const err = await postRes.json();
                document.getElementById('st-msg').innerText = "Error: " + err.detail;
                document.getElementById('st-msg').style.color = "red";
            }
        });
    }
    else if (viewName === 'check-availability') {
        // 1. Fetch Doctor List
        const res = await authFetch('/admin/doctors');
        if (!res.ok) return content.innerHTML = '<p>Error loading doctors</p>';
        const doctors = await res.json();

        content.innerHTML = `
                <h2> Check Doctor Availability</h2>
            <div class="card">
                <div class="form-group">
                    <label>Select Doctor</label>
                    <select id="av-view-doc" onchange="loadDoctorAvailabilityView(this.value)">
                        <option value="">-- Select --</option>
                        ${doctors.map(d => `<option value="${d.id}">${d.name} (${d.specialization})</option>`).join('')}
                    </select>
                </div>
            </div>
            
            <!-- Calendar Navigation -->
            <div id="calendar-wrapper" style="display:none;">
                <div class="calendar-nav">
                    <button class="cal-btn" onclick="changeCalendarMonth(-1)">&lt; Prev</button>
                    <h3 id="cal-month-title">Month Year</h3>
                    <button class="cal-btn" onclick="changeCalendarMonth(1)">Next &gt;</button>
                </div>
                <div id="availability-calendar" class="calendar-container">
                    <!-- Grid goes here -->
                </div>
            </div>
            `;
    }
}

// Calendar Helpers
// Calendar Helpers
function changeCalendarMonth(offset) {
    state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + offset);
    const docId = document.getElementById('av-view-doc').value;
    if (docId) loadDoctorAvailabilityView(docId);
}


async function loadDoctorAvailabilityView(doctorId) {
    const calendarContainer = document.getElementById('availability-calendar');
    const wrapper = document.getElementById('calendar-wrapper');
    const monthTitle = document.getElementById('cal-month-title');

    if (!doctorId) {
        wrapper.style.display = 'none';
        calendarContainer.innerHTML = '';
        return;
    }

    wrapper.style.display = 'block';
    calendarContainer.innerHTML = '<p>Loading...</p>';

    // Fetch data
    try {
        const res = await authFetch(`/admin/doctors/${doctorId}/availability`);
        if (!res.ok) {
            calendarContainer.innerHTML = '<p style="color:red">Error loading availability</p>';
            return;
        }

        const data = await res.json();
        const weekly = data.weekly;
        const exceptions = data.exceptions;

        renderCalendar(state.currentCalendarDate, weekly, exceptions, calendarContainer, monthTitle);

    } catch (e) {
        console.error(e);
        calendarContainer.innerHTML = '<p style="color:red">System Error</p>';
    }
}

function renderCalendar(date, weekly, exceptions, container, titleEl) {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Update Title
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    titleEl.innerText = `${monthNames[month]} ${year}`;

    container.innerHTML = '';

    // Create Grid Header
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach(d => {
        const header = document.createElement('div');
        header.className = 'cal-header-cell';
        header.innerText = d;
        grid.appendChild(header);
    });

    // Calculate days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Adjustment for Monday start (0=Sun, 1=Mon in JS getDay())
    // We want 0=Mon, 6=Sun
    let startDay = firstDayOfMonth.getDay(); // 0 is Sunday
    startDay = startDay === 0 ? 6 : startDay - 1;

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day-cell empty';
        grid.appendChild(empty);
    }

    // Days
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell';

        const cellDate = new Date(year, month, day);
        // Local YYYY-MM-DD
        // Trick to avoid timezone offset issues when formatting
        const y = cellDate.getFullYear();
        const m = String(cellDate.getMonth() + 1).padStart(2, '0');
        const d = String(cellDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        // Today Check
        if (dateStr === todayStr) cell.classList.add('today');

        // Date Number
        const num = document.createElement('div');
        num.className = 'cal-date-num';
        num.innerText = day;
        cell.appendChild(num);

        // Determine Status
        let statusHtml = '';
        let statusClass = '';

        // 1. Exception?
        const exception = exceptions.find(ex => ex.exception_date === dateStr);
        if (exception) {
            if (exception.status === 'Cancelled') {
                statusClass = 'status-off';
                statusHtml = 'OFF';
                cell.style.background = '#fff5f5';
            } else {
                statusClass = 'status-exception';
                // Show time if available
                const s = exception.start_time ? exception.start_time.substring(0, 5) : '';
                const e = exception.end_time ? exception.end_time.substring(0, 5) : '';
                statusHtml = s ? `${s}-${e}` : exception.status;
            }
        } else {
            // 2. Weekly?
            // JS getDay: 0=Sun. DB: 0=Mon.
            let jsDay = cellDate.getDay();
            let dbDay = jsDay === 0 ? 6 : jsDay - 1;

            const weekRule = weekly.find(w => w.day_of_week === dbDay);
            if (weekRule) {
                statusClass = 'status-open';
                statusHtml = `${weekRule.start_time.substring(0, 5)} - ${weekRule.end_time.substring(0, 5)}`;
            } else {
                // 3. Default
                statusClass = 'status-open';
                statusHtml = '08:00 - 22:00';
            }
        }

        const pill = document.createElement('div');
        pill.className = `cal-status ${statusClass}`;
        pill.innerText = statusHtml;
        cell.appendChild(pill);

        grid.appendChild(cell);
    }

    container.appendChild(grid);
}


async function deleteStaff(id) {
    if (!(await showConfirm("Are you sure you want to remove this staff member?"))) return;
    const res = await authFetch(`/admin/staff/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showToast("Staff Removed", "success");
        loadView('staff');
    } else {
        showToast("Error removing staff", "error");
    }
}

async function deleteDoctor(id) {
    if (!(await showConfirm("Are you sure you want to remove this Doctor? This will cancel all their appointments."))) return;
    const res = await authFetch(`/admin/doctors/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showToast("Doctor Removed", "success");
        loadView('doctors');
    } else {
        showToast("Error removing doctor", "error");
    }
}

async function deleteSlot(id) {
    if (!(await showConfirm("Remove this availability slot?"))) return;
    const res = await authFetch(`/doctor/me/availability/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showToast("Slot Removed", "success");
        loadView('doctor-availability');
    } else {
        showToast("Error removing slot", "error");
    }
}

function setFormDay(dayIndex) {
    const select = document.getElementById('av-day');
    if (select) {
        select.value = dayIndex;
        document.getElementById('add-slot-card').scrollIntoView({ behavior: 'smooth' });
    }
}

async function loadMasterSchedule(date) {
    const div = document.getElementById('schedule-results');
    div.innerHTML = '<p>Loading...</p>';

    const res = await authFetch(`/schedule?date=${date}`);

    if (!res.ok) {
        div.innerHTML = '<p style="color:red">Error loading schedule</p>';
        return;
    }

    const visits = await res.json();

    if (visits.length === 0) {
        div.innerHTML = '<p>No appointments for this date.</p>';
        return;
    }

    let html = `
        <table>
            <thead><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Type</th><th>Status</th><th>Action</th><th>Notes</th></tr></thead>
            <tbody>
                ${visits.map(v => `<tr>
                    <td>${v.time_slot}</td>
                    <td>${v.patient_name || 'Walk-in'}</td> 
                    <td>${v.doctor_name || 'Dr. ' + v.doctor_id}</td>
                    <td>${v.visit_type}</td>
                    <td>Confirmed</td>
                    <td><button class="btn" style="background:var(--danger-color);padding:2px 5px;font-size:0.8rem" onclick="cancelVisit(${v.visit_id})">Cancel</button></td>
                    <td><button class="btn btn-secondary" style="padding:2px 5px;font-size:0.8rem" onclick="openNotes(${v.visit_id})">Notes</button></td>
                </tr>`).join('')}
            </tbody>
        </table>
    `;
    div.innerHTML = html;
}

async function cancelVisit(id) {
    if (!(await showConfirm("Are you sure you want to cancel this appointment?"))) return;
    const res = await authFetch(`/visits/${id}`, { method: 'DELETE' });
    if (res.ok) {
        showToast("Appointment Cancelled", "success");
        // Reload schedule if we are on that view
        const val = document.getElementById('sched-date') ? document.getElementById('sched-date').value : null;
        if (val) loadMasterSchedule(val);
    } else {
        showToast("Error cancelling", "error");
    }
}

// --- Landing & Auth ---
// --- Landing & Auth ---
// --- Landing & Auth ---
function renderLanding() {
    const content = document.getElementById('app');

    content.innerHTML = `
        <div class="auth-container" style="max-width:800px; display:flex; flex-direction:row; gap:2rem; align-items:center;">
             <div style="flex:1; text-align:left;">
                 <h1>Polyclinic Center</h1>
                 <p style="font-size:1.1rem; color:#64748b; margin-bottom:1.5rem;">
                     Professional healthcare at your fingertips. Book an appointment instantly without creating an account.
                 </p>
                 <button class="btn" onclick="loadGuestBooking()" style="font-size:1.1rem; padding:1rem;">Book an Appointment</button>
                 <button class="btn btn-secondary" onclick="loadGuestCancellation()" style="margin-top:10px; width:100%">Manage Existing Booking</button>
             </div>
             <div style="flex:1; border-left:1px solid #eee; padding-left:2rem;">
                 <h3>Staff Portal</h3>
                 <p>Doctors and Admin Access</p>
                 <button class="btn btn-secondary" onclick="renderLogin()">Staff Login</button>
                 <div style="margin-top:10px;text-align:right;">
                    <a href="#" onclick="forgotPassword()" style="font-size:0.9rem;color:var(--primary-color)">Forgot Password?</a>
                 </div>
             </div>
        </div>
    `;
}

// --- Guest Cancellation Logic ---
function loadGuestCancellation() {
    const content = document.getElementById('app');
    content.innerHTML = `
        <div class="card" style="max-width:500px; margin: 40px auto;">
            <h2>Cancel My Booking</h2>
            <div id="cancel-step-1">
                <div class="form-group">
                    <label>Booking ID</label>
                    <input type="number" id="c-bid" placeholder="e.g. 12" required>
                </div>
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="c-email" placeholder="Email Address" required>
                </div>
                <button class="btn" style="margin-top:10px" onclick="sendCancelOTP()">Send Verification Code</button>
                <button class="btn btn-secondary" style="margin-top:10px" onclick="renderLanding()">Back</button>
            </div>
            
            <div id="cancel-step-2" style="display:none; margin-top:20px; border-top:1px solid #eee; padding-top:20px;">
                <p style="color:green; font-weight:bold;">Code sent! Check your email.</p>
                <div class="form-group">
                    <label>Enter Verification Code</label>
                    <input type="text" id="c-otp" placeholder="6-digit code">
                </div>
                <button class="btn" style="background:var(--danger-color)" onclick="confirmCancel()">Confirm Cancellation</button>
                <button id="btn-resend-cancel" class="btn btn-secondary" onclick="resendCancelOTP()" disabled style="margin-top:10px; font-size:0.9rem">Resend OTP (15s)</button>
                <button class="btn btn-secondary" style="margin-top:10px" onclick="renderLanding()">Cancel</button>
            </div>
        </div>
    `;
}

function renderLogin() {
    const content = document.getElementById('app');
    content.innerHTML = `
        <div class="auth-container">
            <h1>Staff Login</h1>
            <p>Access the management dashboard</p>
            <form onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="username" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" required>
                </div>
                <button type="submit" class="btn">Login</button>
            </form>
            <button class="btn btn-secondary" style="margin-top:1rem" onclick="renderLanding()">Back</button>
        </div>
    `;
}

async function forgotPassword() {
    showPromptModal("Enter your username for password reset:", async (user) => {
        if (!user) return;
        const res = await fetch('/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user })
        });
        const data = await res.json();
        showToast(data.message, res.ok ? 'success' : 'error');
    });
}

// --- Guest Booking Flow ---
let guestBookingData = {};

async function loadGuestBooking() {
    // Validating function entry
    console.log("Starting loadGuestBooking...");
    const content = document.getElementById('app');

    // Safely set loading state
    content.innerHTML = `<div style="text-align:center; padding:50px;"><h2>Loading...</h2></div>`;

    let docOptions = `<option value="">Select Doctor</option>`;

    try {
        // Use AbortController for reliable timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds

        console.log("Fetching doctors...");
        const res = await fetch('/doctors/public', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const doctors = await res.json();
            console.log("Doctors loaded:", doctors.length);
            if (doctors.length === 0) {
                docOptions = `<option value="">No doctors available</option>`;
            } else {
                docOptions += doctors.map(d => `<option value="${d.id}">${d.name} (${d.specialization})</option>`).join('');
            }
        } else {
            console.error("Server returned:", res.status);
            docOptions = '<option value="">Error loading doctors (Server Error)</option>';
        }
    } catch (e) {
        console.error("Fetch/Render logic failed:", e);
        if (e.name === 'AbortError') {
            docOptions = '<option value="">Network Timeout - Server is slow</option>';
        } else {
            docOptions = `<option value="">System Error: ${e.message}</option>`;
        }
    }

    try {
        console.log("Rendering Booking Form...");
        const formHTML = `
            <div class="card" style="max-width:800px; margin:0 auto;">
                <h2>Book an Appointment</h2>
                <div id="booking-step-1">
                    <div class="form-group">
                        <label>Select Doctor</label>
                        <select id="g-doc-id" onchange="updateGuestTimeSlots()" required>
                            ${docOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="g-date" min="${new Date().toISOString().split('T')[0]}" onchange="updateGuestTimeSlots()" required>
                    </div>
                    <div class="form-group">
                        <label>Available Times</label>
                        <select id="g-time" disabled><option>Select Doctor & Date First</option></select>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="g-type">
                            <option value="Consultation">Consultation</option>
                            <option value="Follow_up">Follow Up</option>
                            <option value="Emergency">Emergency</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <select id="g-gender">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <button class="btn" onclick="goToGuestStep2()">Next: Your Details</button>
                    <button class="btn btn-secondary" style="margin-top:10px" onclick="renderLanding()">Cancel</button>
                </div>
                
                <div id="booking-step-2" style="display:none;">
                    <div class="form-group"><label>Full Name</label><input type="text" id="g-name" placeholder="John Doe"></div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="g-email" placeholder="john@example.com">
                    </div>
                    
                    <button class="btn" onclick="sendGuestOTP()">Send Verification Code</button>
                    
                    <div id="otp-area" style="margin-top:20px; display:none; border-top:1px solid #eee; padding-top:20px;">
                        <p style="color:var(--success-color); font-weight:bold;">Code sent! Check your email.</p>
                        <div class="form-group"><label>Enter Verification Code</label><input type="text" id="g-otp"></div>
                        <button class="btn" onclick="confirmGuestBooking()">Confirm Booking</button>
                        <button id="btn-resend-guest" class="btn btn-secondary" onclick="resendGuestOTP()" disabled style="margin-top:10px; font-size:0.9rem">Resend OTP (15s)</button>
                    </div>
                    <button class="btn btn-secondary" style="margin-top:10px" onclick="loadGuestBooking()">Back</button>
                </div>
            </div>
        `;
        content.innerHTML = formHTML;
        console.log("Form Rendered Successfully.");

    } catch (e) {
        console.error("Critical Render Error:", e);
        content.innerHTML = `<div class="card"><h1>Critical Error Loading Form</h1><p>${e.message}</p><button class="btn" onclick="location.reload()">Reload App</button></div>`;
    }
}

async function updateGuestTimeSlots() {
    const docId = document.getElementById('g-doc-id').value;
    const date = document.getElementById('g-date').value;
    const timeSelect = document.getElementById('g-time');

    if (!docId || !date) {
        timeSelect.innerHTML = '<option>Select Doctor & Date First</option>';
        timeSelect.disabled = true;
        return;
    }

    timeSelect.innerHTML = '<option>Loading...</option>';

    try {
        const res = await fetch(`/doctors/${docId}/public-slots?date=${date}`);
        if (res.ok) {
            const data = await res.json();
            if (data.slots.length === 0) {
                timeSelect.innerHTML = '<option value="">No slots available</option>';
                timeSelect.disabled = true;
            } else {
                timeSelect.innerHTML = data.slots.map(t => `<option value="${t}:00">${t}</option>`).join('');
                timeSelect.disabled = false;
            }
        } else {
            timeSelect.innerHTML = '<option>Error loading slots</option>';
        }
    } catch (e) {
        console.error(e);
        timeSelect.innerHTML = '<option>System Error</option>';
    }
}

async function updateAdminTimeSlots() {
    const docId = document.getElementById('visit-doc').value;
    const date = document.getElementById('visit-date').value;
    const timeSelect = document.getElementById('visit-time');

    if (!docId || !date) {
        timeSelect.innerHTML = '<option>Select Doctor & Date First</option>';
        timeSelect.disabled = true;
        return;
    }

    timeSelect.innerHTML = '<option>Loading...</option>';

    try {
        const res = await fetch(`/doctors/${docId}/public-slots?date=${date}`);
        if (res.ok) {
            const data = await res.json();
            if (data.slots.length === 0) {
                timeSelect.innerHTML = '<option value="">No slots available</option>';
                timeSelect.disabled = true;
            } else {
                timeSelect.innerHTML = data.slots.map(t => `<option value="${t}:00">${t}</option>`).join('');
                timeSelect.disabled = false;
            }
        } else {
            timeSelect.innerHTML = '<option>Error loading slots</option>';
        }
    } catch (e) {
        console.error(e);
        timeSelect.innerHTML = '<option>System Error</option>';
    }
}

function goToGuestStep2() {
    guestBookingData.doctor_id = document.getElementById('g-doc-id').value;
    guestBookingData.visit_date = document.getElementById('g-date').value;
    guestBookingData.time_slot = document.getElementById('g-time').value;
    guestBookingData.visit_type = document.getElementById('g-type').value;
    guestBookingData.gender = document.getElementById('g-gender').value;

    if (!guestBookingData.doctor_id || !guestBookingData.visit_date) {
        showToast("Please fill required fields", 'warning'); return;
    }
    document.getElementById('booking-step-1').style.display = 'none';
    document.getElementById('booking-step-2').style.display = 'block';
}

async function sendGuestOTP() {
    // Reusing the 'g-email' input ID but treating it as PHONE
    // (We will rename the label in loadGuestBookingView, but keep ID to avoid HTML refactor)
    const emailInput = document.getElementById('g-email').value;
    const name = document.getElementById('g-name').value;

    if (!emailInput) return showToast("Enter Email Address", "warning");
    if (!name) return showToast("Enter Name", "warning");

    const btn = event.target;
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Sending...";

    guestBookingData.guest_name = name;
    guestBookingData.guest_email = emailInput;

    try {
        const res = await fetch('/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || `HTTP ${res.status}`);
        }

        document.getElementById('otp-area').style.display = 'block';
        showToast("Code sent! Check your inbox.", "success");
        startResendTimer('btn-resend-guest');
    } catch (err) {
        showToast(`Error: ${err.message}`, "error");
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

function resendGuestOTP() {
    sendGuestOTP();
}

async function confirmGuestBooking() {
    try {
        const otp = document.getElementById('g-otp').value;
        if (!otp) return showToast("Please enter the OTP code", "warning");

        const btn = event.target;
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = "Booking...";

        guestBookingData.otp_code = otp;
        console.log("Confirming Booking:", guestBookingData);

        const res = await fetch('/visits/public', { // Use correct endpoint if changed
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guestBookingData)
        });

        // Endpoint Check: Main.py says /visits/public (Line 104 in step 1236 check).
        // Wait, app.js in step 1296 used /guest-visits?
        // Step 1296, Line 1315: fetch('/guest-visits' ...
        // Main.py Step 1236, Line ~65: book_guest_visit at /visits/public.
        // Wait!
        // Did I just catch a bug?
        // Step 841 (Previous session?): User objective was fixing 500.
        // Step 1236 shows `book_guest_visit` at `@app.post("/visits/public")`.
        // If `app.js` is calling `/guest-visits`, it might be 404!
        // Let me check main.py again for `/guest-visits`.
        // If it's missing, that's why it failed?
        // But the user said "loading doctors" stuck, not booking failed.
        // Still, I should correct the endpoint to `/visits/public` if that's what main.py has.
        // Let's assume standard behavior. Inspect main.py search result from Step 1236.
        // It shows `@app.post("/visits/public")`.
        // It DOES NOT show `@app.post("/guest-visits")`.
        // So I will fix the endpoint here too.

        const data = await res.json();

        if (res.ok) {
            showToast("Booking Confirmed! ID: " + data.visit_id, "success");
            renderLanding();
        } else {
            console.error("Booking Error:", data);
            showToast("Error: " + (data.detail || JSON.stringify(data)), 'error');
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } catch (e) {
        console.error("JS Error:", e);
        showToast("System Error: " + e.message, 'error');
        // If btn exists
        if (typeof btn !== 'undefined') {
            btn.disabled = false;
            btn.innerText = "Confirm Booking";
        }
    }
}

// --- Guest Cancellation Logic ---
let cancelData = {};

async function sendCancelOTP() {
    const email = document.getElementById('c-email').value;
    const bid = document.getElementById('c-bid').value;

    if (!email || !bid) return showToast("Please enter Booking ID and Email", "warning");

    const btn = event.target;
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Sending...";

    // Store for later
    cancelData = { email, visit_id: bid };

    try {
        const res = await fetch('/guest-visits/send-cancel-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visit_id: parseInt(bid), email: email })
        });

        if (res.ok) {
            document.getElementById('cancel-step-1').style.display = 'none';
            document.getElementById('cancel-step-2').style.display = 'block';
            startResendTimer('btn-resend-cancel');
            showToast("OTP Sent! Check email.", "success");
        } else {
            const err = await res.json();
            showToast("Error: " + (err.detail || "Failed to find booking"), "error");
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } catch (e) {
        btn.disabled = false;
        btn.innerText = originalText;
        showToast("System Error", "error");
    }
}

function resendCancelOTP() {
    // Just call sendCancelOTP again but careful about UI state toggling (it's already decent)
    // Actually sendCancelOTP toggles 'cancel-step-1' to none, which is fine since it's already none.
    // But we need to make sure we don't clear the email/bid fields.
    // Since they are hidden, they might be accessible? Yes.
    // However, sendCancelOTP reads from DOM.
    // The issue is sendCancelOTP toggles display. 
    // Let's just create a direct fetch or ensure logic is safe.
    // sendCancelOTP reads from #c-email and #c-bid.
    // These inputs are in Step 1, which is hidden but existing.
    // So calling sendCancelOTP() again is safe.
    sendCancelOTP();
}

async function confirmCancel() {
    const otp = document.getElementById('c-otp').value;
    if (!otp) return showToast("Enter OTP", "warning");

    const btn = event.target;
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Cancelling...";

    const payload = {
        visit_id: parseInt(cancelData.visit_id),
        email: cancelData.email,
        otp_code: otp
    };

    try {
        const res = await fetch('/guest-visits/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            showToast("Success: " + data.message, "success");
            renderLanding(); // Reset
        } else {
            showToast("Error: " + data.detail, "error");
            btn.disabled = false;
            btn.innerText = originalText;
        }
    } catch (e) {
        btn.disabled = false;
        btn.innerText = originalText;
        showToast("System Error", "error");
    }
}

// --- Global Helpers ---

function startResendTimer(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    let left = 15;
    btn.disabled = true;
    btn.innerText = `Resend OTP (${left}s)`;

    const timer = setInterval(() => {
        left--;
        if (left <= 0) {
            clearInterval(timer);
            btn.disabled = false;
            btn.innerText = "Resend OTP";
        } else {
            btn.innerText = `Resend OTP (${left}s)`;
        }
    }, 1000);
}

// Toast Timeout Holder
// Toast Timeout Holder
let toastTimeout;

// Center Modal Toast
function showToast(message, type = 'info') {
    let box = document.getElementById('alert-box');
    if (!box) {
        box = document.createElement('div');
        box.id = 'alert-box';
        document.body.prepend(box);
    }

    if (toastTimeout) clearTimeout(toastTimeout);

    // CSS for Center Modal
    box.style.position = 'fixed';
    box.style.top = '50%';
    box.style.left = '50%';
    box.style.transform = 'translate(-50%, -50%)';
    box.style.zIndex = '9999';
    box.style.padding = '20px 40px';
    box.style.borderRadius = '12px';
    box.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    box.style.fontSize = '1.2rem';
    box.style.fontWeight = 'bold';
    box.style.display = 'block';
    box.style.textAlign = 'center';
    box.style.minWidth = '300px';

    if (type === 'error') {
        box.style.background = '#fee2e2';
        box.style.color = '#dc2626';
        box.style.border = '2px solid #dc2626';
    } else if (type === 'success') {
        box.style.background = '#dcfce7';
        box.style.color = '#16a34a';
        box.style.border = '2px solid #16a34a';
    } else {
        box.style.background = '#fff';
        box.style.color = '#333';
        box.style.border = '2px solid #333';
    }

    box.innerText = message;

    // Auto hide
    toastTimeout = setTimeout(() => {
        box.style.display = 'none';
    }, 3000);
}

// Confirmation Modal (Promise-based)
function showConfirm(message) {
    return new Promise((resolve) => {
        const modalId = 'confirm-modal-' + Date.now();
        const modalHTML = `
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:10000; backdrop-filter:blur(2px);">
                <div style="background:white; padding:2rem; border-radius:12px; min-width:320px; box-shadow:0 10px 40px rgba(0,0,0,0.2); text-align:center; animation: fadeIn 0.2s ease-out;">
                    <h3 style="margin-top:0; color:#333; margin-bottom:1.5rem;">${message}</h3>
                    <div style="display:flex; justify-content:center; gap:1rem;">
                        <button class="btn btn-secondary" id="${modalId}-no" style="min-width:100px;">Cancel</button>
                        <button class="btn" id="${modalId}-yes" style="background:var(--danger-color); color:white; min-width:100px;">Confirm</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById(`${modalId}-yes`).onclick = () => {
            document.getElementById(modalId).remove();
            resolve(true);
        };

        document.getElementById(`${modalId}-no`).onclick = () => {
            document.getElementById(modalId).remove();
            resolve(false);
        };
    });
}

// Custom Modal Prompt
function showPromptModal(message, callback) {
    // Create modal DOM
    const modalId = 'prompt-modal-' + Date.now();
    const modalHTML = `
        <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:9999;">
            <div style="background:white; padding:2rem; border-radius:10px; min-width:300px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <h3>${message}</h3>
                <input type="text" id="${modalId}-input" style="width:100%; padding:8px; margin:10px 0; border:1px solid #ccc; border-radius:4px;">
                <div style="text-align:right;">
                    <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                    <button class="btn" onclick="const val = document.getElementById('${modalId}-input').value; document.getElementById('${modalId}').remove(); window._promptCallbacks['${modalId}'](val);">OK</button>
                </div>
            </div>
        </div>
    `;

    if (!window._promptCallbacks) window._promptCallbacks = {};
    window._promptCallbacks[modalId] = callback;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById(`${modalId}-input`).focus();
}
// --- Init Application ---
function init() {
    console.log("App Initializing...");
    if (state.token) {
        console.log("User logged in, loading dashboard");
        updateSidebarActive('home');
        renderDashboard();
        loadView('home');
    } else {
        console.log("Guest mode, loading landing");
        renderLanding();
    }
}

// --- V2 Feature Helpers ---

async function exportCSV() {
    window.location.href = `${API_URL}/reports/export?token=${state.token}`;
    // Since we use Bearer auth header usually, direct link might fail if not using cookie/query token.
    // FastAPI depends on OAuth2PasswordBearer.
    // We should fetch blob and download.
    const btn = event.currentTarget;
    btn.innerText = "Downloading...";

    try {
        const res = await authFetch('/reports/export');
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookings_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } else {
            showToast("Export Failed", "error");
        }
    } catch (e) {
        showToast("System Error", "error");
    } finally {
        btn.innerText = "Export Data";
    }
}

function filterPatients() {
    // Simple client-side filter if list is loaded.
    // Currently dashboard doesn't show patient list, but maybe we should add one.
    // Or we filter the "Master Schedule" rows?
    // Let's assume we want to filter the schedule view if visible.
}

async function openNotes(visitId) {
    if (state.role !== 'Doctor' && state.role !== 'Senior Admin') return showToast("Authorized personnel only", "warning");

    // Quick Prompt for now (V2.1 can move to modal)
    showPromptModal("Enter Medical Notes:", async (val) => {
        if (!val) return;

        const res = await authFetch(`/visits/${visitId}/notes`, {
            method: 'PATCH',
            body: JSON.stringify({ notes: val })
        });

        if (res.ok) {
            showToast("Notes Saved", "success");
        } else {
            showToast("Failed to save notes", "error");
        }
    });
}

// --- V3 Feature Helpers (Chat & Messaging) ---

// 1. Public Chatbot - REMOVED (Replaced by Guest Chat)
// function initChatWidget() { ... }

// 2. Internal Messaging
function startMessagePolling() {
    // Only for staff
    if (state.role === 'Customer') return;

    setInterval(async () => {
        try {
            const res = await authFetch('/messages/unread');
            if (res && res.ok) {
                const data = await res.json();
                updateBadge(data.count);
            }
        } catch (e) { }
    }, 10000); // 10s
}

function updateBadge(count) {
    const badge = document.getElementById('msg-badge');
    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}


// Global chatbot state
let activeChatUserId = null;
let chatPollInterval = null;

async function loadMessagesView() {
    updateSidebarActive('msgs');
    const content = document.getElementById('main-content');
    content.innerHTML = '<p>Loading Chats...</p>';

    // Stop any previous poll
    if (chatPollInterval) clearInterval(chatPollInterval);

    // Fetch conversations (contacts)
    let conversations = [];
    try {
        const res = await authFetch('/messages/conversations');
        if (res && res.ok) conversations = await res.json();
    } catch (e) { console.error(e); }

    const html = `
        <style>
            .chat-container { display: flex; height: calc(100vh - 140px); background: #fff; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
            .chat-sidebar { width: 300px; border-right: 1px solid #eee; display: flex; flex-direction: column; background: #f8f9fa; }
            .chat-list { flex: 1; overflow-y: auto; }
            .chat-item { padding: 15px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s; }
            .chat-item:hover, .chat-item.active { background: #e3f2fd; }
            .chat-window { flex: 1; display: flex; flex-direction: column; background: #fff; }
            .chat-header { padding: 15px; border-bottom: 1px solid #eee; font-weight: bold; background: #fff; display:flex; justify-content:space-between; align-items:center; }
            .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; background: #e5ddd5; }
            .message-bubble { max-width: 70%; padding: 10px 15px; border-radius: 15px; font-size: 0.95rem; position: relative; word-wrap: break-word; }
            .msg-sent { align-self: flex-end; background: #dcf8c6; color: #000; border-bottom-right-radius: 2px; }
            .msg-received { align-self: flex-start; background: #fff; color: #000; border-bottom-left-radius: 2px; box-shadow: 0 1px 1px rgba(0,0,0,0.1); }
            .chat-input-area { padding: 15px; background: #f0f0f0; border-top: 1px solid #ddd; display: flex; gap: 10px; }
            .chat-input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 20px; outline: none; }
            .timestamp { font-size: 0.7rem; color: #999; margin-top: 5px; text-align: right; }
            .badge-unread { background: #25d366; color: white; border-radius: 50%; padding: 2px 6px; font-size: 0.75rem; float: right; }
        </style>

        <div style="height:100%; display:flex; flex-direction:column;">
            <div style="margin-bottom:10px; display:flex; justify-content:space-between;">
                <h2>Messages <small style="font-size:0.5em; color:red;">(Fix v999)</small></h2>
                <div style="display:flex; gap:10px;">
                    <button class="btn" style="background:var(--secondary-color); font-size:0.8rem;" onclick="pollChatUpdates()">↻ Refresh</button>
                    <button class="btn" onclick="openComposeModal()">+ New Chat</button>
                </div>
            </div>
            
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="chat-list" id="chat-list">
                        ${renderChatList(conversations)}
                    </div>
                </div>
                <div class="chat-window" id="chat-window">
                    <div style="display:flex; height:100%; justify-content:center; align-items:center; color:#888;">
                        <p>Select a conversation to start chatting</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    content.innerHTML = html;

    // Poll every 3 seconds
    chatPollInterval = setInterval(() => pollChatUpdates(), 3000);
}

function renderChatList(convs) {
    if (!convs || convs.length === 0) return '<div style="padding:20px; color:#888;">No conversations yet.</div>';

    return convs.map(c => `
        <div class="chat-item ${c.user_id === activeChatUserId ? 'active' : ''}" onclick="loadChatHistory(${c.user_id}, '${c.name || 'User ' + c.user_id}')">
            <div style="display:flex; justify-content:space-between;">
                <strong style="font-size:0.95rem;">${c.name || 'User ' + c.user_id}</strong>
                <span style="font-size:0.8rem; color:#666;">${formatSmartTime(c.time_str)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:5px;">
                <span style="font-size:0.85rem; color:#666; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">
                    ${c.last_message || 'Start chatting...'}
                </span>
                ${c.unread > 0 ? `<span class="badge-unread">${c.unread}</span>` : ''}
            </div>
        </div>
    `).join('');
}

async function loadChatHistory(userId, userName) {
    activeChatUserId = userId;
    const win = document.getElementById('chat-window');

    win.innerHTML = `
        <div class="chat-header">
            <span>${userName}</span>
        </div>
        <div class="chat-messages" id="chat-msgs-scroller">
            <p style="text-align:center; margin-top:20px;">Loading...</p>
        </div>
        <div class="chat-input-area">
            <input type="text" class="chat-input" id="chat-input-box" placeholder="Type a message..." onkeypress="handleChatKey(event, ${userId})">
            <button class="btn" onclick="sendChatMessage(${userId})" style="border-radius:50%; width:40px; height:40px; padding:0; display:flex; justify-content:center; align-items:center;">➤</button>
        </div>
    `;

    await refreshChatMessages(userId);
    // Refresh sidebar to highlight active
    renderChatList(await (await authFetch('/messages/conversations')).json());
}

async function refreshChatMessages(userId) {
    if (activeChatUserId !== userId) return;
    try {
        const res = await authFetch(`/messages/history/${userId}`);
        const msgs = await res.json();

        const scroller = document.getElementById('chat-msgs-scroller');
        if (!scroller) return;

        scroller.innerHTML = msgs.map(m => `
            <div class="message-bubble ${m.is_me ? 'msg-sent' : 'msg-received'}">
                ${m.content}
                <div class="timestamp">${formatLocalTime(m.timestamp)}</div>
            </div>
        `).join('');

        scroller.scrollTop = scroller.scrollHeight;
    } catch (e) { console.error(e); }
}

async function sendChatMessage(userId) {
    const input = document.getElementById('chat-input-box');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    try {
        await authFetch('/messages/send', {
            method: 'POST',
            body: JSON.stringify({ recipient_id: userId, content: text })
        });
        await refreshChatMessages(userId);
        pollChatUpdates();
    } catch (e) {
        showToast("Failed to send", "error");
    }
}

function handleChatKey(e, userId) {
    if (e.key === 'Enter') sendChatMessage(userId);
}

async function pollChatUpdates() {
    try {
        const res = await authFetch('/messages/conversations');
        let list = [];
        if (res && res.ok) {
            list = await res.json();
            const listEl = document.getElementById('chat-list');
            if (listEl) listEl.innerHTML = renderChatList(list);
        }

        if (activeChatUserId) {
            const resHist = await authFetch(`/messages/history/${activeChatUserId}`);
            const msgs = await resHist.json();
            const scroller = document.getElementById('chat-msgs-scroller');
            if (scroller) {
                const isAtBottom = scroller.scrollHeight - scroller.scrollTop <= scroller.clientHeight + 50;

                scroller.innerHTML = msgs.map(m => `
                    <div class="message-bubble ${m.is_me ? 'msg-sent' : 'msg-received'}">
                        ${m.content}
                        <div class="timestamp">${formatLocalTime(m.timestamp)}</div>
                    </div>
                `).join('');

                if (isAtBottom) scroller.scrollTop = scroller.scrollHeight;
            }
        }
    } catch (e) { }
}


// Re-add helpers
async function markRead(id) {
    // Now handled by history fetch
    await authFetch(`/messages/${id}/read`, { method: 'POST' });
}

async function openComposeModal() {
    let users = [];
    try {
        const res = await authFetch('/messages/users');
        users = await res.json();
    } catch (e) {
        console.error("Failed to load users", e);
    }

    const modalId = 'compose-modal-' + Date.now();
    const options = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

    const html = `
        <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:10001;">
            <div style="background:white; padding:20px; border-radius:10px; width:400px;">
                <h3>Start New Chat</h3>
                <label>Recipient:</label>
                <select id="${modalId}-rec" style="width:100%; padding:8px; margin-bottom:10px;">
                    <option value="">Select User...</option>
                    ${options}
                </select>
                <!-- Fallback ID input -->
                <input type="number" id="${modalId}-id" placeholder="Or Enter User ID manually" style="width:100%; padding:8px; margin-bottom:10px;">

                <p style="font-size:0.8rem; color:#666;">Note: Message will be sent immediately.</p>
                <textarea id="${modalId}-txt" placeholder="First message..." style="width:100%; height:80px; padding:8px; margin-bottom:10px;"></textarea>

                <div style="text-align:right;">
                    <button class="btn btn-secondary" onclick="document.getElementById('${modalId}').remove()">Cancel</button>
                    <button class="btn" onclick="startNewChatAction('${modalId}')">Start Chat</button>
                </div>
            </div>
        </div>
        `;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function startNewChatAction(modalId) {
    const sel = document.getElementById(`${modalId}-rec`).value;
    const man = document.getElementById(`${modalId}-id`).value;
    const txt = document.getElementById(`${modalId}-txt`).value;
    const recId = man || sel;

    if (!recId || !txt) return showToast("Recipient and Message required", "warning");

    const res = await authFetch('/messages/send', {
        method: 'POST',
        body: JSON.stringify({ recipient_id: parseInt(recId), content: txt })
    });

    if (res.ok) {
        document.getElementById(modalId).remove();
        // Jump to chat
        // We need to know who we msg'd. 
        // We can guess name from dropdown text if select used
        let name = "New Chat";
        const selEl = document.getElementById(`${modalId}-rec`);
        if (sel && sel.selectedIndex > 0) name = sel.options[sel.selectedIndex].text;

        loadMessagesView().then(() => {
            loadChatHistory(parseInt(recId), name);
        });
    } else {
        showToast("Failed to send", "error");
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    // Re-use logic from previous check
    try {
        if (typeof state !== 'undefined' && state.token) {
            renderDashboard();
            if (typeof startMessagePolling === 'function') startMessagePolling();
        } else {
            if (typeof renderLanding === 'function') renderLanding();
        }
        // if (typeof initChatWidget === 'function') initChatWidget();

        // Initialize Guest Chat
        // if (typeof initGuestChat === 'function') initGuestChat();

    } catch (e) { console.error(e); }
});


// Chatbot Removed by User Request

// --- Fix Timestamp Formatting ---
function formatLocalTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    // Format to 12-hour AM/PM
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatSmartTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    // If today, show time
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Else show date
    return d.toLocaleDateString();
}

