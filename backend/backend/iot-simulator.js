/**
 * IoT Simulator — mimics Sentinel Hub + Worker Wristband
 * Sends real-time sensor and vitals data to the backend every 5 seconds.
 * Run with: node iot-simulator.js
 */

import dotenv from 'dotenv';
dotenv.config();

const API_URL  = `http://localhost:${process.env.PORT || 5000}/api`;
const IOT_KEY  = process.env.IOT_API_KEY || 'iot_sentinel_device_key_2024';

// Replace these with real MongoDB ObjectIds after running seed.js
// Run: node -e "import('./seed.js')" then copy IDs from DB
const WORKER_IDS = [
  'REPLACE_WITH_WORKER_1_ID',
  'REPLACE_WITH_WORKER_2_ID',
  'REPLACE_WITH_WORKER_3_ID',
];

const SITE_STATES = {
  'SITE-A': { h2s: 3.2,  ch4: 8.1,  o2: 20.4, water: 12, tilt: 0   },
  'SITE-B': { h2s: 9.0,  ch4: 18.0, o2: 18.5, water: 40, tilt: 2.0 },
  'SITE-C': { h2s: 1.5,  ch4: 4.0,  o2: 20.8, water: 5,  tilt: 0   },
  'SITE-D': { h2s: 5.5,  ch4: 11.0, o2: 19.5, water: 25, tilt: 0.5 },
};

const WORKER_STATES = WORKER_IDS.map((id) => ({
  workerId: id,
  hr: 75 + Math.floor(Math.random() * 20),
  spo2: 96 + Math.floor(Math.random() * 3),
}));

// ─── Drift sensor value ───────────────────────────────────────────────────────
function drift(val, amount = 0.5, min = 0, max = 100) {
  return +Math.min(max, Math.max(min, val + (Math.random() - 0.5) * amount)).toFixed(1);
}

// ─── Push sensor reading ──────────────────────────────────────────────────────
async function pushSensorReading(siteId) {
  const s = SITE_STATES[siteId];
  SITE_STATES[siteId] = {
    h2s:   drift(s.h2s,   0.8, 0,  30),
    ch4:   drift(s.ch4,   1.5, 0,  40),
    o2:    drift(s.o2,    0.1, 15, 21),
    water: drift(s.water, 2.0, 0,  80),
    tilt:  drift(s.tilt,  0.2, 0,  20),
  };

  const body = {
    siteId,
    h2sLevel:   SITE_STATES[siteId].h2s,
    ch4Level:   SITE_STATES[siteId].ch4,
    o2Level:    SITE_STATES[siteId].o2,
    waterLevel: SITE_STATES[siteId].water,
    tiltAngle:  SITE_STATES[siteId].tilt,
    temperature: +(22 + Math.random() * 5).toFixed(1),
  };

  try {
    const res = await fetch(`${API_URL}/sensors/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': IOT_KEY },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log(`[SENSOR] ${siteId} → H2S:${body.h2sLevel} CH4:${body.ch4Level} O2:${body.o2Level} Water:${body.waterLevel}cm | Alerts fired: ${data.alerts}`);
  } catch (err) {
    console.error(`[SENSOR ERROR] ${siteId}:`, err.message);
  }
}

// ─── Push vitals ──────────────────────────────────────────────────────────────
async function pushVitals(workerState, token) {
  if (!workerState.workerId || workerState.workerId.startsWith('REPLACE')) return;

  // Drift HR and SpO2
  workerState.hr   = Math.max(55, Math.min(180, workerState.hr   + Math.round((Math.random() - 0.5) * 6)));
  workerState.spo2 = Math.max(85, Math.min(100, workerState.spo2 + Math.round((Math.random() - 0.5) * 1)));

  const body = {
    workerId:     workerState.workerId,
    heartRate:    workerState.hr,
    spO2:         workerState.spo2,
    fallDetected: Math.random() < 0.005,  // 0.5% chance of fall
    sosPressed:   Math.random() < 0.001,  // 0.1% chance of SOS
  };

  try {
    const res = await fetch(`${API_URL}/workers/vitals/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      console.log(`[VITALS] Worker ${workerState.workerId.slice(-6)} → HR:${body.heartRate} SpO2:${body.spO2}%${body.sosPressed ? ' 🚨 SOS!' : ''}${body.fallDetected ? ' ⚠️ FALL!' : ''}`);
    }
  } catch (err) {
    console.error(`[VITALS ERROR]:`, err.message);
  }
}

// ─── Main loop ────────────────────────────────────────────────────────────────
async function getToken() {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'supervisor@safeguard.in', password: 'password123' }),
    });
    const data = await res.json();
    return data.token;
  } catch {
    console.error('[SIM] Could not get auth token — is the server running?');
    return null;
  }
}

async function main() {
  console.log('🚀 SafeGuard IoT Simulator starting...');
  console.log(`   API: ${API_URL}`);
  console.log('   Pushing sensor + vitals data every 5 seconds\n');

  const token = await getToken();
  if (!token) {
    console.error('❌ Auth failed. Make sure the server is running and the DB is seeded.');
    process.exit(1);
  }
  console.log('✅ Auth token obtained\n');

  // Run immediately, then every 5 seconds
  const tick = async () => {
    for (const siteId of Object.keys(SITE_STATES)) {
      await pushSensorReading(siteId);
    }
    for (const workerState of WORKER_STATES) {
      await pushVitals(workerState, token);
    }
    console.log('─'.repeat(60));
  };

  await tick();
  setInterval(tick, 5000);
}

main();
