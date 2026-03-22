import { Router } from 'express';
import Job    from '../models/Job.js';
import Worker from '../models/Worker.js';
import SafetyLog from '../models/SafetyLog.js';
import { protect } from '../middleware/auth.js';
import { io } from '../server.js';

const router = Router();
router.use(protect);

const cap = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : 'Medium';

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const { status, workerId } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (workerId) filter.workerId = workerId;
    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .populate('workerId',     'name worker_id status')
      .populate('supervisorId', 'name');
    res.json({ jobs, count: jobs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/history
router.get('/history', async (req, res) => {
  try {
    const jobs = await Job.find({ status: { $in: ['Completed', 'Cancelled'] } })
      .sort({ endedAt: -1 }).limit(50)
      .populate('workerId', 'name worker_id')
      .populate('supervisorId', 'name');
    res.json({ jobs, count: jobs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('workerId', 'name worker_id status location')
      .populate('supervisorId', 'name email');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs
router.post('/', async (req, res) => {
  try {
    const { worker_id, workerId, title, task_description, location, site, priority, status, notes } = req.body;

    const resolvedWorkerId = workerId || worker_id;
    if (!resolvedWorkerId) return res.status(400).json({ error: 'worker_id is required' });

    const resolvedTitle = title || task_description;
    if (!resolvedTitle) return res.status(400).json({ error: 'title is required' });

    const resolvedSite = site || location?.address || 'Not specified';

    const worker = await Worker.findById(resolvedWorkerId);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const job = await Job.create({
      title:        resolvedTitle,
      supervisorId: req.supervisor._id,
      workerId:     resolvedWorkerId,
      site:         resolvedSite,
      location:     location || { address: resolvedSite },
      priority:     cap(priority || 'medium'),
      status:       cap(status   || 'pending'),
      notes:        notes || '',
    });

    await Worker.findByIdAndUpdate(resolvedWorkerId, { status: 'active', current_job: job._id });

    await job.populate([
      { path: 'workerId',     select: 'name worker_id status' },
      { path: 'supervisorId', select: 'name' },
    ]);

    SafetyLog.create({
      type: 'Job', event: `Job "${job.title}" dispatched to ${worker.name}`,
      severity: 'info', jobId: job._id, workerId: resolvedWorkerId,
      actorId: req.supervisor._id, actorType: 'supervisor',
    }).catch(() => {});

    io.emit('job:created', job);
    res.status(201).json({ success: true, job });
  } catch (err) {
    console.error('[JOBS] POST error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id/start
router.patch('/:id/start', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id, { status: 'In Progress', startedAt: new Date() }, { new: true }
    ).populate('workerId', 'name worker_id');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await Worker.findByIdAndUpdate(job.workerId, { status: 'active' });
    io.emit('job:updated', job);
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id/end
router.patch('/:id/end', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id, { status: 'Completed', endedAt: new Date() }, { new: true }
    ).populate('workerId', 'name worker_id');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await Worker.findByIdAndUpdate(job.workerId, { status: 'idle', current_job: null });
    io.emit('job:updated', job);
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id, { status: 'Cancelled', endedAt: new Date() }, { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await Worker.findByIdAndUpdate(job.workerId, { status: 'idle', current_job: null });
    io.emit('job:updated', job);
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
