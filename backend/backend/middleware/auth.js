import jwt from 'jsonwebtoken';
import Supervisor from '../models/Supervisor.js';

// Verify JWT — attach supervisor to req.supervisor
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const supervisor = await Supervisor.findById(decoded.id);
    if (!supervisor || !supervisor.isActive) {
      return res.status(401).json({ error: 'Account not found or inactive' });
    }

    req.supervisor = supervisor;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Require admin role
export function requireAdmin(req, res, next) {
  if (req.supervisor?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Verify IoT device API key (for sensor ingestion)
export function iotApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.IOT_API_KEY) {
    return res.status(401).json({ error: 'Invalid IoT API key' });
  }
  next();
}
