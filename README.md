# SafeGuard — Supervisor Dashboard

A real-time web-based Supervisor Dashboard for monitoring sanitation workers deployed in manholes and sewer systems. Built as part of the Smart Safety and Assistance System for Solapur Municipal Corporation (SMC).

---

## About

This dashboard is the central monitoring interface for supervisors managing field workers in hazardous underground environments. It provides live environmental sensor data, worker health monitoring, job dispatch, alert management, and permanent safety logs — all updated in real time.

---

## Features

- **Authentication** — Secure supervisor login and signup with JWT and bcrypt
- **Dashboard Overview** — Live summary of active workers, site safety status, and active alerts
- **Live Worker Map** — Real-time worker locations on OpenStreetMap with status indicators
- **Environmental Monitoring** — Live gas gauges for H2S, CH4, O2, and water level per site
- **Worker Management** — Add, edit, remove workers and view live vitals
- **Job Dispatch** — Assign jobs with worker availability dropdown, start and end jobs
- **Alert Center** — Real-time alerts with acknowledge and resolve actions
- **Safety Logs** — Permanent log of all safety events with CSV export
- **Analytics** — Gas level trends, worker health trends, and weekly incident summary
- **Settings** — Configure alert thresholds and notification preferences

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Map | Leaflet.js |
| Real-time | Socket.io-client |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT + bcrypt |
| Real-time server | Socket.io |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)

### Frontend Setup
```bash
cd safeguard-dashboard
npm install
npm run dev
```
Open http://localhost:5173

### Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:
```
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
IOT_API_KEY=iot_sentinel_device_key_2024
CLIENT_URL=http://localhost:5173
```
```bash
npm run seed
npm run dev
```
Server runs at http://localhost:5000

### Login Credentials (after seed)
```
Email:    supervisor@safeguard.in
Password: password123
```

---

## Project Structure
```
safeguard-dashboard/
├── src/
│   ├── SafetyDashboard.jsx   ← Main dashboard component
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
└── package.json
```

---



## Team

**Team Codexa**
SIES Graduate School of Technology, Navi Mumbai

| Name | Branch |
|---|---|
| Akshata Chettiar | Computer Engineering |
| Boga Pavitra Raghunath | Computer Engineering |
| Arohi Pathak | Computer Engineering |
| Kaveesh Kadirvel | Information Technology |
| Devanshu Bansode | IoT |

**Mentor:** Dr. Aparna Bhonde

---

## Hackathon

SAMVED 2026 — PS-4: Smart Safety and Assistance System for Sanitation Workers of Solapur Municipal Corporation