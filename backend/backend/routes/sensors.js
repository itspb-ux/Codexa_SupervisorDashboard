import { Router } from 'express';
import SensorReading from '../models/SensorReading.js';
import { protect, iotApiKey } from '../middleware/auth.js';
import { checkSensorThresholds, SENSOR_THRESHOLDS } from '../services/alertEngine.js';
import { io } from '../server.js';

const router = Router();

// ─── Compute safety status from reading ──────────────────────────────────────
function computeSafetyStatus(data) {
  for (const [field, cfg] of Object.entries(SENSOR_THRESHOLDS)) {
    const val = data[field];
    if (val === undefined) continue;
    const isDanger = cfg.invertedDanger ? val <= cfg.danger : val >= cfg.danger;
    if (isDanger) return 'Unsafe';
  }
  for (const [field, cfg] of Object.entries(SENSOR_THRESHOLDS)) {
    const val = data[field];
    if (val === undefined) continue;
    const isWarn = cfg.invertedDanger ? val <= cfg.warn : val >= cfg.warn;
    if (isWarn) return 'Warn';
  }
  return 'Safe';
}

// POST /api/sensors/ingest  — IoT Sentinel Hub pushes data (API key auth)
router.post('/ingest', iotApiKey, async (req, res) => {
  try {
    const safetyStatus = computeSafetyStatus(req.body);
    const reading = await SensorReading.create({ ...req.body, safetyStatus });

    // Broadcast to all connected dashboard clients
    io.emit('sensor:update', reading);

    // Run alert engine
    const alerts = await checkSensorThresholds(reading);

    res.status(201).json({ reading, alerts: alerts.length });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/sensors/:siteId/latest
router.get('/:siteId/latest', protect, async (req, res) => {
  try {
    const reading = await SensorReading
      .findOne({ siteId: req.params.siteId })
      .sort({ timestamp: -1 });

    if (!reading) return res.status(404).json({ error: 'No readings found for site' });
    res.json(reading);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/:siteId/history?from=&to=&limit=200
router.get('/:siteId/history', protect, async (req, res) => {
  try {
    const { from, to, limit = 100 } = req.query;
    const filter = { siteId: req.params.siteId };

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }

    const readings = await SensorReading
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit), 500));

    res.json(readings.reverse()); // chronological order
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/all/latest  — latest reading for all sites
router.get('/all/latest', protect, async (req, res) => {
  try {
    const sites = await SensorReading.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$siteId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ]);
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
