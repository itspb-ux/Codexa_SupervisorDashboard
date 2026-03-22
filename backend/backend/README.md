# SafeGuard Backend — Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

---

## 1. Install dependencies

```bash
cd backend
npm install
```

---

## 2. Configure environment

Edit `.env` (already created):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/safeguard   # or your Atlas URI
JWT_SECRET=safeguard_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d
IOT_API_KEY=iot_sentinel_device_key_2024
CLIENT_URL=http://localhost:5173
```

For **MongoDB Atlas**, replace MONGO_URI with:
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/safeguard
```

---

## 3. Seed the database

```bash
npm run seed
```

This creates:
- 2 supervisor accounts
- 6 workers with wristband IDs
- 6 jobs (mixed statuses)
- 100+ historical sensor readings
- 150+ vitals records
- 8 alerts
- 10 safety log entries

**Login credentials after seeding:**
```
Email:    supervisor@safeguard.in
Password: password123
```

---

## 4. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:5000`

---

## 5. Run the IoT Simulator (optional)

Simulates real Sentinel Hub + Wristband devices pushing data every 5 seconds:

```bash
node iot-simulator.js
```

> Note: After seeding, copy real Worker ObjectIds from MongoDB into `iot-simulator.js`
> to enable vitals simulation for specific workers.

---

## API Reference

### Auth
| Method | Endpoint          | Description        | Auth     |
|--------|-------------------|--------------------|----------|
| POST   | /api/auth/login   | Supervisor login   | None     |
| GET    | /api/auth/me      | Get current user   | JWT      |
| POST   | /api/auth/logout  | Logout             | JWT      |

### Workers
| Method | Endpoint                        | Description              | Auth     |
|--------|---------------------------------|--------------------------|----------|
| GET    | /api/workers                    | List all workers         | JWT      |
| GET    | /api/workers/:id                | Worker + latest vitals   | JWT      |
| POST   | /api/workers                    | Create worker            | JWT      |
| PATCH  | /api/workers/:id/status         | Update status            | JWT      |
| GET    | /api/workers/:id/vitals         | Vitals history           | JWT      |
| POST   | /api/workers/vitals/ingest      | Push wristband data      | JWT      |

### Sensors
| Method | Endpoint                        | Description              | Auth     |
|--------|---------------------------------|--------------------------|----------|
| POST   | /api/sensors/ingest             | IoT device push          | API Key  |
| GET    | /api/sensors/:siteId/latest     | Latest reading           | JWT      |
| GET    | /api/sensors/:siteId/history    | Time series              | JWT      |
| GET    | /api/sensors/all/latest         | All sites latest         | JWT      |

### Jobs
| Method | Endpoint                | Description       | Auth |
|--------|-------------------------|-------------------|------|
| GET    | /api/jobs               | List jobs         | JWT  |
| POST   | /api/jobs               | Dispatch job      | JWT  |
| GET    | /api/jobs/:id           | Job details       | JWT  |
| PATCH  | /api/jobs/:id/start     | Start job         | JWT  |
| PATCH  | /api/jobs/:id/end       | Complete job      | JWT  |

### Alerts
| Method | Endpoint                        | Description           | Auth |
|--------|---------------------------------|-----------------------|------|
| GET    | /api/alerts                     | List alerts           | JWT  |
| GET    | /api/alerts/:id                 | Alert details         | JWT  |
| PATCH  | /api/alerts/:id/acknowledge     | Acknowledge alert     | JWT  |
| PATCH  | /api/alerts/:id/resolve         | Resolve alert         | JWT  |

### Analytics
| Method | Endpoint                        | Description              | Auth |
|--------|---------------------------------|--------------------------|------|
| GET    | /api/analytics/gas-trends       | Gas level time series    | JWT  |
| GET    | /api/analytics/health-trends    | Vitals time series       | JWT  |
| GET    | /api/analytics/incidents        | Incident summary         | JWT  |
| GET    | /api/analytics/summary          | Dashboard summary counts | JWT  |

---

## Socket.io Events

### Server → Client (dashboard listens)
| Event              | Payload                  | Description               |
|--------------------|--------------------------|---------------------------|
| `sensor:update`    | SensorReading document   | New sensor reading        |
| `alert:new`        | Alert document           | New alert triggered       |
| `alert:updated`    | Alert document           | Alert status changed      |
| `vitals:update`    | Vitals document          | New vitals reading        |
| `worker:statusUpdate` | { workerId, status }  | Worker status changed     |
| `worker:emergency` | { workerId }             | Emergency triggered       |
| `job:new`          | Job document             | New job dispatched        |
| `job:updated`      | Job document             | Job status changed        |

### Client → Server
| Event              | Payload                  | Description               |
|--------------------|--------------------------|---------------------------|
| `join:supervisor`  | supervisorId             | Join supervisor room      |

---

## Project Structure

```
backend/
├── server.js              # Entry point, Express + Socket.io setup
├── seed.js                # Database seed script
├── iot-simulator.js       # Hardware simulator for testing
├── .env                   # Environment variables
├── models/
│   ├── Supervisor.js      # Auth + supervisor accounts
│   ├── Worker.js          # Field worker profiles
│   ├── Vitals.js          # Wristband health readings
│   ├── SensorReading.js   # Sentinel Hub gas/env data
│   ├── Alert.js           # System alerts
│   ├── Job.js             # Dispatched jobs
│   └── SafetyLog.js       # Audit trail
├── routes/
│   ├── auth.js
│   ├── workers.js
│   ├── sensors.js
│   ├── alerts.js
│   ├── jobs.js
│   ├── analytics.js
│   └── logs.js
├── middleware/
│   └── auth.js            # JWT + IoT API key middleware
└── services/
    └── alertEngine.js     # Threshold evaluation + alert creation
```
