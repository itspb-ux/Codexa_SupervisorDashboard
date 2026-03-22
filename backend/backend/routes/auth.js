import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Supervisor from '../models/Supervisor.js';
import { protect } from '../middleware/auth.js';

const router = Router();

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existing = await Supervisor.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
const supervisor = await Supervisor.create({ name, email, passwordHash: password, phone, role: 'supervisor' });
    const token = signToken(supervisor._id);
    res.status(201).json({ success: true, token, supervisor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const supervisor = await Supervisor.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!supervisor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await supervisor.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken(supervisor._id);
    res.json({ success: true, token, supervisor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ success: true, supervisor: req.supervisor });
});

// POST /api/auth/logout
router.post('/logout', protect, (_req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

export default router;