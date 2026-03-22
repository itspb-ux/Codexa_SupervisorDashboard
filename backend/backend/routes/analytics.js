import { Router } from 'express';
import SensorReading from '../models/SensorReading.js';
import Vitals from '../models/Vitals.js';
import Alert from '../models/Alert.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

// GET /api/analytics/gas-trends?siteId=SITE-A&hours=24
router.get('/gas-trends', async (req, res) => {
  try {
    const hours  = parseInt(req.query.hours)  || 24;
    const siteId = req.query.siteId || null;
    const since  = new Date(Date.now() - hours * 3600 * 1000);

    const filter = { timestamp: { $gte: since } };
    if (siteId) filter.siteId = siteId;

    const readings = await SensorReading.find(filter)
      .sort({ timestamp: 1 })
      .select('siteId h2sLevel ch4Level o2Level waterLevel timestamp');

    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/health-trends?workerId=...&hours=24
router.get('/health-trends', async (req, res) => {
  try {
    const hours    = parseInt(req.query.hours) || 24;
    const workerId = req.query.workerId || null;
    const since    = new Date(Date.now() - hours * 3600 * 1000);

    const filter = { timestamp: { $gte: since } };
    if (workerId) filter.workerId = workerId;

    const vitals = await Vitals.find(filter)
      .sort({ timestamp: 1 })
      .select('workerId heartRate spO2 timestamp');

    res.json(vitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/incidents?days=7
router.get('/incidents', async (req, res) => {
  try {
    const days  = parseInt(req.query.days) || 7;
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const incidents = await Alert.aggregate([
      { $match: { triggeredAt: { $gte: since } } },
      {
        $group: {
          _id: {
            date:     { $dateToString: { format: '%Y-%m-%d', date: '$triggeredAt' } },
            severity: '$severity',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/summary  — dashboard summary numbers
router.get('/summary', async (req, res) => {
  try {
    const [totalAlerts, activeAlerts, criticalAlerts] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'Active' }),
      Alert.countDocuments({ status: 'Active', severity: 'critical' }),
    ]);

    res.json({ totalAlerts, activeAlerts, criticalAlerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
