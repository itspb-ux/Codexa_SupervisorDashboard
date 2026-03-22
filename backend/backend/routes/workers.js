import { Router } from 'express';
import Worker from '../models/Worker.js';
import { protect } from '../middleware/auth.js';
import { io } from '../server.js';

const router = Router();
router.use(protect);

// GET /api/workers
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip  = (page - 1) * limit;

    const filter = { isActive: true };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name:      { $regex: search, $options: 'i' } },
        { worker_id: { $regex: search, $options: 'i' } },
      ];
    }

    const [workers, total] = await Promise.all([
      Worker.find(filter)
        .populate('current_job', 'title task_description status location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Worker.countDocuments(filter),
    ]);

    res.json({ workers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workers/:id
router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).populate('current_job');
    if (!worker || !worker.isActive) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workers — create worker
router.post('/', async (req, res) => {
  try {
    const {
      name, worker_id, phone, wristband_id,
      status, heart_rate, spo2, health_status, location,
    } = req.body;

    if (!name || !worker_id) {
      return res.status(400).json({ error: 'Name and Worker ID are required' });
    }

    // Check for duplicate worker_id
    const existing = await Worker.findOne({ worker_id });
    if (existing) {
      return res.status(400).json({ error: `Worker ID ${worker_id} already exists` });
    }

    const worker = await Worker.create({
      name,
      worker_id,
      phone:        phone        || '',
      wristband_id: wristband_id || '',
      status:       status       || 'idle',
      heart_rate:   heart_rate   || 75,
      spo2:         spo2         || 98,
      health_status: health_status || 'Good',
      location:     location     || { lat: 0, lng: 0, address: 'Not assigned' },
      isActive:     true,
    });

    io.emit('worker:new', worker);
    res.status(201).json({ success: true, worker });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/workers/:id — update worker
router.put('/:id', async (req, res) => {
  try {
    const { password, passwordHash, ...updateData } = req.body;

    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('current_job');

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    io.emit('worker:updated', worker);
    res.json({ success: true, worker });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/workers/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    io.emit('worker:deleted', { workerId: req.params.id });
    res.json({ success: true, message: 'Worker removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/workers/:id/vitals — update vitals from wristband
router.patch('/:id/vitals', async (req, res) => {
  try {
    const { heart_rate, spo2, location, status } = req.body;

    let health_status = 'Good';
    if (heart_rate > 140 || spo2 < 90) health_status = 'Critical';
    else if (heart_rate > 110 || spo2 < 94) health_status = 'Warning';

    const updateFields = { health_status };
    if (heart_rate !== undefined) updateFields.heart_rate = heart_rate;
    if (spo2       !== undefined) updateFields.spo2       = spo2;
    if (status     !== undefined) updateFields.status     = status;
    if (location) {
      updateFields['location.lat']       = location.lat;
      updateFields['location.lng']       = location.lng;
      updateFields['location.address']   = location.address || '';
      updateFields['location.updatedAt'] = new Date();
    }

    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    io.emit('vitals:update', {
      workerId:      worker._id,
      name:          worker.name,
      heart_rate:    worker.heart_rate,
      spo2:          worker.spo2,
      health_status: worker.health_status,
      status:        worker.status,
      location:      worker.location,
    });

    res.json({ success: true, worker });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;