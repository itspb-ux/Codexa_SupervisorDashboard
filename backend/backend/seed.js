import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import Supervisor    from './models/Supervisor.js';
import Worker        from './models/Worker.js';
import Job           from './models/Job.js';
import SensorReading from './models/SensorReading.js';
import Alert         from './models/Alert.js';
import Vitals        from './models/Vitals.js';
import SafetyLog     from './models/SafetyLog.js';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[SEED] Connected to MongoDB');

 // Skip if data already exists
const existingCount = await Supervisor.countDocuments();
if (existingCount > 0) {
  console.log('[SEED] Database already has data — skipping seed');
  console.log('[SEED] To force reseed, run: npm run seed -- --force');
  await mongoose.disconnect();
  process.exit(0);
}
console.log('[SEED] Fresh database detected — seeding...');
  // ─── Supervisors ───────────────────────────────────────────────────────────
  const supervisors = await Supervisor.insertMany([
    {
      name: 'Rajesh Sharma',
      email: 'supervisor@safeguard.in',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'admin',
      phone: '+91 98765 43210',
      shift: '06:00 AM – 02:00 PM',
    },
    {
      name: 'Priya Mehta',
      email: 'priya@safeguard.in',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'supervisor',
      phone: '+91 98765 11111',
      shift: '02:00 PM – 10:00 PM',
    },
  ]);
  console.log(`[SEED] Created ${supervisors.length} supervisors`);

  // ─── Workers ───────────────────────────────────────────────────────────────
  const workers = await Worker.insertMany([
    { name: 'Rajan Mehta',   employeeId: 'EMP-101', phone: '+91 9000000001', wristbandId: 'WB-001', status: 'Active', location: { lat: 19.076, lng: 72.877 } },
    { name: 'Suresh Kumar',  employeeId: 'EMP-102', phone: '+91 9000000002', wristbandId: 'WB-002', status: 'Active', location: { lat: 19.082, lng: 72.881 } },
    { name: 'Anil Patil',    employeeId: 'EMP-103', phone: '+91 9000000003', wristbandId: 'WB-003', status: 'Emergency', location: { lat: 19.076, lng: 72.878 } },
    { name: 'Deepak Sharma', employeeId: 'EMP-104', phone: '+91 9000000004', wristbandId: 'WB-004', status: 'Idle',   location: { lat: 19.071, lng: 72.869 } },
    { name: 'Vijay Nair',    employeeId: 'EMP-105', phone: '+91 9000000005', wristbandId: 'WB-005', status: 'Active', location: { lat: 19.082, lng: 72.882 } },
    { name: 'Mohan Das',     employeeId: 'EMP-106', phone: '+91 9000000006', wristbandId: 'WB-006', status: 'Active', location: { lat: 19.065, lng: 72.860 } },
  ]);
  console.log(`[SEED] Created ${workers.length} workers`);

  // ─── Jobs ──────────────────────────────────────────────────────────────────
  const jobs = await Job.insertMany([
    {
      title: 'Manhole Inspection',
      supervisorId: supervisors[0]._id,
      workerId: workers[0]._id,
      site: 'Site A – Sector 4', siteId: 'SITE-A',
      location: { lat: 19.076, lng: 72.877, address: 'Sector 4, Zone A' },
      priority: 'High', status: 'In Progress',
      startedAt: new Date(Date.now() - 2 * 3600000),
    },
    {
      title: 'Pipe Cleaning',
      supervisorId: supervisors[0]._id,
      workerId: workers[1]._id,
      site: 'Site B – Block 7', siteId: 'SITE-B',
      location: { lat: 19.082, lng: 72.881, address: 'Block 7, Zone B' },
      priority: 'Medium', status: 'In Progress',
      startedAt: new Date(Date.now() - 3600000),
    },
    {
      title: 'Emergency Gas Response',
      supervisorId: supervisors[0]._id,
      workerId: workers[2]._id,
      site: 'Site A – Sector 4', siteId: 'SITE-A',
      location: { lat: 19.076, lng: 72.878, address: 'Sector 4, Zone A' },
      priority: 'Critical', status: 'Emergency',
      startedAt: new Date(Date.now() - 30 * 60000),
    },
    {
      title: 'Drain Unblocking',
      supervisorId: supervisors[0]._id,
      workerId: workers[5]._id,
      site: 'Site D – Hub 3', siteId: 'SITE-D',
      location: { lat: 19.065, lng: 72.860, address: 'Hub 3, Zone D' },
      priority: 'Medium', status: 'In Progress',
      startedAt: new Date(Date.now() - 4 * 3600000),
    },
    {
      title: 'Water Level Check',
      supervisorId: supervisors[0]._id,
      workerId: workers[4]._id,
      site: 'Site B – Block 7', siteId: 'SITE-B',
      priority: 'High', status: 'In Progress',
      startedAt: new Date(Date.now() - 90 * 60000),
    },
    {
      title: 'Routine Survey',
      supervisorId: supervisors[0]._id,
      workerId: workers[3]._id,
      site: 'Site C – Zone 2', siteId: 'SITE-C',
      priority: 'Low', status: 'Pending',
    },
  ]);
  console.log(`[SEED] Created ${jobs.length} jobs`);

  // Update workers with job references
  await Worker.findByIdAndUpdate(workers[0]._id, { currentJobId: jobs[0]._id });
  await Worker.findByIdAndUpdate(workers[1]._id, { currentJobId: jobs[1]._id });
  await Worker.findByIdAndUpdate(workers[2]._id, { currentJobId: jobs[2]._id });
  await Worker.findByIdAndUpdate(workers[4]._id, { currentJobId: jobs[4]._id });
  await Worker.findByIdAndUpdate(workers[5]._id, { currentJobId: jobs[3]._id });

  // ─── Sensor Readings (last 12 hours, every 30 min) ─────────────────────────
  const SITES = [
    { siteId: 'SITE-A', h2s: 3.2,  ch4: 8.1,  o2: 20.4, water: 12, tilt: 0   },
    { siteId: 'SITE-B', h2s: 11.4, ch4: 22.7, o2: 18.1, water: 45, tilt: 2.1 },
    { siteId: 'SITE-C', h2s: 1.8,  ch4: 5.2,  o2: 20.9, water: 8,  tilt: 0   },
    { siteId: 'SITE-D', h2s: 6.9,  ch4: 12.4, o2: 19.2, water: 28, tilt: 0.5 },
  ];

  const sensorDocs = [];
  for (const site of SITES) {
    for (let i = 24; i >= 0; i--) {
      const t = new Date(Date.now() - i * 30 * 60000);
      const drift = () => (Math.random() - 0.5) * 1.5;
      const h2s   = Math.max(0, site.h2s   + drift());
      const ch4   = Math.max(0, site.ch4   + drift() * 2);
      const o2    = Math.min(21, Math.max(15, site.o2 + drift() * 0.2));
      const water = Math.max(0, site.water + drift() * 3);
      const safetyStatus = h2s >= 10 || ch4 >= 25 || o2 <= 16 || water >= 60
        ? 'Unsafe' : h2s >= 5 || ch4 >= 10 || o2 <= 19.5 || water >= 30
        ? 'Warn' : 'Safe';
      sensorDocs.push({ siteId: site.siteId, h2sLevel: +h2s.toFixed(1), ch4Level: +ch4.toFixed(1), o2Level: +o2.toFixed(1), waterLevel: +water.toFixed(0), tiltAngle: site.tilt, safetyStatus, timestamp: t });
    }
  }
  await SensorReading.insertMany(sensorDocs);
  console.log(`[SEED] Created ${sensorDocs.length} sensor readings`);

  // ─── Vitals (last 2 hours, every 5 min per worker) ─────────────────────────
  const vitalsDocs = [];
  const baseVitals = [
    { hr: 78, spo2: 98 }, { hr: 82, spo2: 97 },
    { hr: 142, spo2: 88 }, { hr: 72, spo2: 99 },
    { hr: 88, spo2: 96 }, { hr: 74, spo2: 98 },
  ];
  for (let w = 0; w < workers.length; w++) {
    for (let i = 24; i >= 0; i--) {
      const t = new Date(Date.now() - i * 5 * 60000);
      const hr   = Math.max(50, Math.min(180, baseVitals[w].hr   + Math.round((Math.random() - 0.5) * 8)));
      const spo2 = Math.max(85, Math.min(100, baseVitals[w].spo2 + Math.round((Math.random() - 0.5) * 2)));
      vitalsDocs.push({ workerId: workers[w]._id, jobId: jobs[w]?._id || null, heartRate: hr, spO2: spo2, fallDetected: false, sosPressed: false, timestamp: t });
    }
  }
  await Vitals.insertMany(vitalsDocs);
  console.log(`[SEED] Created ${vitalsDocs.length} vitals records`);

  // ─── Alerts ────────────────────────────────────────────────────────────────
  const alerts = await Alert.insertMany([
    { type: 'Gas Leak',       severity: 'critical', status: 'Active',        message: 'H2S level at 11.4 ppm — critical threshold exceeded', workerId: workers[1]._id, jobId: jobs[1]._id, siteId: 'SITE-B', value: 11.4, threshold: 10, triggeredAt: new Date(Date.now() - 2  * 60000) },
    { type: 'SOS Button',     severity: 'critical', status: 'Active',        message: 'SOS button pressed by worker wristband',               workerId: workers[2]._id, jobId: jobs[2]._id, siteId: 'SITE-A', triggeredAt: new Date(Date.now() - 3  * 60000) },
    { type: 'Low Oxygen',     severity: 'critical', status: 'Active',        message: 'O₂ level dropped to 18.1% — below safe threshold',     workerId: workers[1]._id, jobId: jobs[1]._id, siteId: 'SITE-B', value: 18.1, threshold: 19.5, triggeredAt: new Date(Date.now() - 5  * 60000) },
    { type: 'Fall Detected',  severity: 'warning',  status: 'Active',        message: 'Accelerometer detected sudden fall event',              workerId: workers[4]._id, jobId: jobs[4]._id, siteId: 'SITE-B', triggeredAt: new Date(Date.now() - 12 * 60000) },
    { type: 'High CH4',       severity: 'warning',  status: 'Active',        message: 'Methane at 12.4% LEL — approaching danger zone',        workerId: workers[3]._id, jobId: jobs[5]._id, siteId: 'SITE-D', value: 12.4, threshold: 10, triggeredAt: new Date(Date.now() - 18 * 60000) },
    { type: 'High Heart Rate',severity: 'warning',  status: 'Acknowledged',  message: 'Heart rate at 142 bpm — possible physical stress',      workerId: workers[2]._id, jobId: jobs[2]._id, value: 142, threshold: 140, triggeredAt: new Date(Date.now() - 22 * 60000) },
    { type: 'Water Rise',     severity: 'warning',  status: 'Resolved',      message: 'Water level rose to 45 cm — approaching danger zone',   workerId: workers[4]._id, jobId: jobs[4]._id, siteId: 'SITE-B', value: 45, threshold: 30, triggeredAt: new Date(Date.now() - 35 * 60000), resolvedAt: new Date(Date.now() - 10 * 60000) },
    { type: 'Gas Leak',       severity: 'critical', status: 'Resolved',      message: 'H2S spike detected — 8.9 ppm',                         workerId: workers[5]._id, jobId: jobs[3]._id, siteId: 'SITE-D', value: 8.9, threshold: 5, triggeredAt: new Date(Date.now() - 3600000), resolvedAt: new Date(Date.now() - 30 * 60000) },
  ]);
  console.log(`[SEED] Created ${alerts.length} alerts`);

  // ─── Safety Logs ───────────────────────────────────────────────────────────
  await SafetyLog.insertMany([
    { type: 'Alert',  event: 'H2S critical at Site B',           severity: 'critical', workerId: workers[1]._id, jobId: jobs[1]._id, siteId: 'SITE-B', actorType: 'device',      timestamp: new Date(Date.now() - 2  * 60000) },
    { type: 'Alert',  event: 'SOS activated – Anil Patil',        severity: 'critical', workerId: workers[2]._id, jobId: jobs[2]._id,                   actorType: 'device',      timestamp: new Date(Date.now() - 3  * 60000) },
    { type: 'Vitals', event: 'SpO₂ dropped to 88% (Anil Patil)', severity: 'warning',  workerId: workers[2]._id,                                        actorType: 'device',      timestamp: new Date(Date.now() - 9  * 60000) },
    { type: 'Job',    event: 'Job Emergency Gas Response started', severity: 'info',    workerId: workers[2]._id, jobId: jobs[2]._id,                   actorType: 'supervisor',  timestamp: new Date(Date.now() - 30 * 60000) },
    { type: 'Sensor', event: 'O₂ below threshold at Site B',      severity: 'warning',                           siteId: 'SITE-B',                      actorType: 'device',      timestamp: new Date(Date.now() - 58 * 60000) },
    { type: 'Alert',  event: 'Fall detected – Vijay Nair',         severity: 'warning',  workerId: workers[4]._id, jobId: jobs[4]._id,                  actorType: 'device',      timestamp: new Date(Date.now() - 45 * 60000) },
    { type: 'Job',    event: 'Job Water Level Check started',      severity: 'info',    workerId: workers[4]._id, jobId: jobs[4]._id,                   actorType: 'supervisor',  timestamp: new Date(Date.now() - 90 * 60000) },
    { type: 'Job',    event: 'Job Drain Unblocking started',       severity: 'info',    workerId: workers[5]._id, jobId: jobs[3]._id,                   actorType: 'supervisor',  timestamp: new Date(Date.now() - 4  * 3600000) },
    { type: 'Job',    event: 'Job Manhole Inspection started',     severity: 'info',    workerId: workers[0]._id, jobId: jobs[0]._id,                   actorType: 'supervisor',  timestamp: new Date(Date.now() - 2  * 3600000) },
    { type: 'Auth',   event: 'Supervisor Rajesh Sharma logged in', severity: 'info',    actorId: supervisors[0]._id, actorType: 'supervisor',           timestamp: new Date(Date.now() - 5  * 3600000) },
  ]);
  console.log(`[SEED] Created safety logs`);

  console.log('\n✅ Database seeded successfully!');
  console.log('─────────────────────────────────────');
  console.log('Login credentials:');
  console.log('  Email:    supervisor@safeguard.in');
  console.log('  Password: password123');
  console.log('─────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[SEED ERROR]', err);
  process.exit(1);
});
