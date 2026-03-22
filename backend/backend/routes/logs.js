import { Router }    from 'express';
import SafetyLog     from '../models/SafetyLog.js';
import Alert         from '../models/Alert.js';
import Job           from '../models/Job.js';
import { protect }   from '../middleware/auth.js';

const router = Router();
router.use(protect);

// GET /api/logs
router.get('/', async (req, res) => {
  try {
    const { type, severity, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (type)     filter.type     = type;
    if (severity) filter.severity = severity;

    const total = await SafetyLog.countDocuments(filter);
    const logs  = await SafetyLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(parseInt(limit), 200))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('workerId', 'name worker_id')
      .populate('jobId',    'title');

    res.json({ logs, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/logs — manually create a log entry
router.post('/', async (req, res) => {
  try {
    const log = await SafetyLog.create({
      ...req.body,
      actorId:   req.supervisor._id,
      actorType: 'supervisor',
    });
    res.status(201).json({ success: true, log });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;