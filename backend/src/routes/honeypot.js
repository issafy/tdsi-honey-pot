import { Router } from 'express';
import { addAttack } from '../services/store.js';
import { getIo } from '../index.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('honeypot');
const router = Router();

/**
 * POST /api/honeypot/event
 * Ingestion endpoint for honeypot services (Cowrie, web honeypot, etc.)
 * Accepts attack events and broadcasts them via WebSocket.
 */
router.post('/event', (req, res) => {
  const { sourceIp, attackType, protocol, port, payload } = req.body;

  if (!sourceIp || !attackType) {
    return res.status(400).json({ error: 'sourceIp and attackType are required' });
  }

  const attack = {
    id: `hp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceIp,
    sourceCountry: '??',
    sourceCountryName: 'Unknown',
    sourceLat: 0,
    sourceLon: 0,
    destLat: 48.8566,
    destLon: 2.3522,
    attackType,
    protocol: protocol || 'TCP',
    port: port || 0,
    severity: 'medium',
    payload: payload || null,
    timestamp: Date.now(),
  };

  const stored = addAttack(attack);
  log.info('event', `${attackType} from ${sourceIp}:${port}`);

  // Broadcast to dashboard
  const io = getIo();
  if (io) {
    io.emit('new_attack', stored);
  }

  res.json({ status: 'ok', id: stored.id });
});

export default router;
