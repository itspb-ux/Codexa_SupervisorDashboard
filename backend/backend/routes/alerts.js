import { Router }   from 'express';
import Alert        from '../models/Alert.js';
import Worker       from '../models/Worker.js';
import SafetyLog    from '../models/SafetyLog.js';
import { protect }  from '../middleware/auth.js';
import { io }       from '../server.js';

const router = Router();
router.use(protect);

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const { status, severity, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (severity) filter.severity = severity;

    const total  = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .sort({ triggeredAt: -1, createdAt: -1 })
      .limit(Math.min(parseInt(limit), 200))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('workerId', 'name worker_id phone')
      .populate('jobId',    'title site');

    // Enrich alerts that have workerId but no populated name
    const enriched = await Promise.all(alerts.map(async (alert) => {
      const obj = alert.toObject();
      // If workerId is just an ObjectId (not populated), fetch manually
      if (obj.workerId && typeof obj.workerId === 'string') {
        const worker = await Worker.findById(obj.workerId).select('name worker_id');
        if (worker) obj.workerId = { name: worker.name, worker_id: worker.worker_id };
      }
      return obj;
    }));

    res.json({ alerts: enriched, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('workerId',       'name worker_id')
      .populate('jobId',          'title site')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy',     'name');
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'Acknowledged', acknowledgedBy: req.supervisor._id },
      { new: true }
    ).populate('workerId', 'name worker_id');

    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    SafetyLog.create({
      type: 'Alert', event: `Alert "${alert.type}" acknowledged by ${req.supervisor.name}`,
      severity: 'info', actorId: req.supervisor._id, actorType: 'supervisor',
    }).catch(() => {});

    io.emit('alert:updated', alert);
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved', resolvedBy: req.supervisor._id, resolvedAt: new Date() },
      { new: true }
    ).populate('workerId', 'name worker_id');

    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    SafetyLog.create({
      type: 'Alert', event: `Alert "${alert.type}" resolved by ${req.supervisor.name}`,
      severity: 'info', actorId: req.supervisor._id, actorType: 'supervisor',
    }).catch(() => {});

    io.emit('alert:updated', alert);
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
