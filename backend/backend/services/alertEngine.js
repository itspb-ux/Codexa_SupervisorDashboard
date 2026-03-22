import Alert from '../models/Alert.js';
import SafetyLog from '../models/SafetyLog.js';
import Worker from '../models/Worker.js';
import { io } from '../server.js';

// ─── Configurable thresholds ──────────────────────────────────────────────────
export const SENSOR_THRESHOLDS = {
  h2sLevel:   { warn: 5,    danger: 10,   unit: 'ppm',   type: 'Gas Leak',    invertedDanger: false },
  ch4Level:   { warn: 10,   danger: 25,   unit: '% LEL', type: 'High CH4',    invertedDanger: false },
  o2Level:    { warn: 19.5, danger: 16,   unit: '%',     type: 'Low Oxygen',  invertedDanger: true  },
  waterLevel: { warn: 30,   danger: 60,   unit: 'cm',    type: 'Water Rise',  invertedDanger: false },
  tiltAngle:  { warn: 5,    danger: 15,   unit: '°',     type: 'Tilt',        invertedDanger: false },
};

export const VITALS_THRESHOLDS = {
  heartRate: { warn: 110, danger: 140, unit: 'bpm', type: 'High Heart Rate', invertedDanger: false },
  spO2:      { warn: 94,  danger: 90,  unit: '%',   type: 'Low SpO2',        invertedDanger: true  },
};

// ─── Evaluate sensor reading and fire alerts ──────────────────────────────────
export async function checkSensorThresholds(reading) {
  const alerts = [];

  for (const [field, cfg] of Object.entries(SENSOR_THRESHOLDS)) {
    const val = reading[field];
    if (val === undefined || val === null) continue;

    const isDanger = cfg.invertedDanger ? val <= cfg.danger : val >= cfg.danger;
    const isWarn   = cfg.invertedDanger ? val <= cfg.warn   : val >= cfg.warn;

    if (!isDanger && !isWarn) continue;

    const severity = isDanger ? 'critical' : 'warning';
    const message  = `${cfg.type}: ${field} at ${val}${cfg.unit} — ${severity} threshold ${isDanger ? cfg.danger : cfg.warn}${cfg.unit} breached`;

    const alert = await Alert.create({
      type: cfg.type,
      severity,
      message,
      siteId: reading.siteId,
      jobId:  reading.jobId || null,
      value:     val,
      threshold: isDanger ? cfg.danger : cfg.warn,
    });

    await SafetyLog.create({
      type: 'Alert', event: message, severity,
      siteId: reading.siteId, jobId: reading.jobId,
      actorType: 'device', metadata: { field, value: val },
    });

    io.emit('alert:new', alert);
    alerts.push(alert);
  }

  return alerts;
}

// ─── Evaluate wristband vitals ────────────────────────────────────────────────
export async function checkVitalsThresholds(vitals) {
  const alerts = [];

  // SOS — always critical
  if (vitals.sosPressed) {
    const alert = await Alert.create({
      type: 'SOS Button', severity: 'critical',
      message: 'SOS button pressed — worker requires immediate assistance',
      workerId: vitals.workerId, jobId: vitals.jobId,
    });
    await Worker.findByIdAndUpdate(vitals.workerId, { status: 'Emergency' });
    io.emit('alert:new', alert);
    io.emit('worker:emergency', { workerId: vitals.workerId });
    alerts.push(alert);
  }

  // Fall detection
  if (vitals.fallDetected) {
    const alert = await Alert.create({
      type: 'Fall Detected', severity: 'critical',
      message: 'Fall detected by wristband accelerometer',
      workerId: vitals.workerId, jobId: vitals.jobId,
    });
    io.emit('alert:new', alert);
    alerts.push(alert);
  }

  // Numeric vitals
  for (const [field, cfg] of Object.entries(VITALS_THRESHOLDS)) {
    const val = vitals[field];
    if (val === undefined || val === null) continue;

    const isDanger = cfg.invertedDanger ? val <= cfg.danger : val >= cfg.danger;
    const isWarn   = cfg.invertedDanger ? val <= cfg.warn   : val >= cfg.warn;
    if (!isDanger && !isWarn) continue;

    const severity = isDanger ? 'critical' : 'warning';
    const message  = `${cfg.type}: ${val}${cfg.unit} for worker`;

    const alert = await Alert.create({
      type: cfg.type, severity, message,
      workerId: vitals.workerId, jobId: vitals.jobId,
      value: val, threshold: isDanger ? cfg.danger : cfg.warn,
    });
    io.emit('alert:new', alert);
    alerts.push(alert);
  }

  return alerts;
}
