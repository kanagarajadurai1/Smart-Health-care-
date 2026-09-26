<div align="center">

# 🏥 Smart Health HMS
### Hospital Management System (Single Page Application)

**A clean, interactive hospital management dashboard prototype built using HTML, CSS, and JavaScript.**

<br/>

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)]()
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)]()
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)]()

<br/>

> *"Simplifying Healthcare Management with Smart UI."*

</div>

---

## 📌 Overview

**Smart Health HMS** is a multi-page demo designed to demonstrate modern UI/UX using **vanilla JavaScript**. The browser demo stores records in local storage. A separate `database/` folder contains SQL Server tables, relationships, indexes, and stored procedures for the app modules; these scripts are not yet connected to the website. An optional Node.js endpoint connects the chat widget to OpenAI when a server-side API key is configured.

This project focuses on delivering a **smooth, responsive, and interactive dashboard experience** without relying on any external frameworks or libraries. Do not enter real patient, employee, or payment information. This prototype is not HIPAA-compliant, is not secured for production, and is not intended for clinical use.

---

## ▶️ Run locally

Node.js 18 or newer is required. From the project folder, start the included server:

```powershell
node server.cjs
```

Then open `http://localhost:5500/` in Chrome. No npm packages are required. Without an API key, the chat widget runs in local demo mode and answers common questions about using the app.

### Database setup

For the SQL Server schema, stored procedures, and optional synthetic seed data, follow [database/README.md](database/README.md). The current website does not connect to SQL Server; database integration requires a secure backend API.

### Enable AI-generated chat replies

The OpenAI API key must stay on the server; never put it in browser JavaScript or commit it to the repository. In PowerShell, set it for the current terminal and then start the server:

```powershell
$env:OPENAI_API_KEY = "your-api-key"
node server.cjs
```

The default model is `gpt-4o-mini`; override it with `$env:OPENAI_MODEL` if needed. API usage may incur provider charges. The assistant is only for general app guidance, not medical advice. Do not send patient or other sensitive data.

### Demo sign-in

| Role | Employee ID | Password |
| --- | --- | --- |
| Admin | `ADM-001` | `Admin@123` |
| Doctor | `DR-2048` | `Doctor@123` |
| Nurse | `NR-1190` | `Nurse@123` |

These hard-coded credentials are for local demonstration only and provide no real authentication.

---

## ✨ Features

- 🔐 Demo login interface (client-side validation only)
- 🎨 Dark / Light mode toggle
- 📊 Dashboard with real-time stats UI
- 👤 Patient management with browser-local persistence
- 🩺 Doctor overview section
- 📅 Appointment display section
- 💳 Invoice creation, status updates, and CSV export
- 🏥 Ward & bed visualization with demo bed assignment
- 🔔 Notification UI & alerts
- 🤖 Assistant widget with local help and optional AI-generated responses
- 📱 Fully responsive design (mobile + desktop)

---

## 📁 Project Structure

smart-health-hms/
│
├── 📄 index.html # Login page (entry point)
├── 📄 dashboard.html # Main dashboard
├── 📄 patients.html # Patient management
├── 📄 doctors.html # Doctors module
├── 📄 appointments.html # Appointments module
├── 📄 billing.html # Billing system
├── 📄 wards.html # Wards & bed management
│
├── 📄 app.js # Core logic (demo auth, session, utilities, local storage)
├── 📄 assistant.js # Chat widget and demo fallback replies
├── 📄 server.cjs # Static file server and server-side AI proxy
├── 📄 login.js # Login functionality
├── 📄 dashboard.js # Dashboard logic
├── 📄 patients.js # Patient operations
├── 📄 modules.js # Doctors, billing, appointments, wards
│
├── 📂 database/ # SQL Server schema, procedures, demo seed, setup guide
│   ├── 00_create_database.sql
│   ├── 01_schema.sql
│   ├── 02_stored_procedures.sql
│   ├── 03_seed_demo.sql
│   └── README.md
│
├── 🎨 style.css # Global styles (dark/light theme)
│
└── 📄 README.md # Project documentation