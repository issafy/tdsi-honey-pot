import { Router } from 'express';
import geoip from 'geoip-lite';
import { addAttack } from '../services/store.js';
import { getIo } from '../index.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('honeypot');
const router = Router();

// Test countries used when GeoIP can't resolve an IP (localhost, private nets, etc.)
// Rotates through them so you see arcs from different regions when self-testing
const FALLBACKS = [
  { country: 'RU', name: 'Russia', lat: 55.7558, lon: 37.6173 },
  { country: 'CN', name: 'China', lat: 39.9042, lon: 116.4074 },
  { country: 'IR', name: 'Iran', lat: 35.6892, lon: 51.3890 },
  { country: 'KP', name: 'North Korea', lat: 39.0392, lon: 125.7625 },
  { country: 'BR', name: 'Brazil', lat: -23.5505, lon: -46.6333 },
  { country: 'NG', name: 'Nigeria', lat: 9.0579, lon: 7.4951 },
  { country: 'IN', name: 'India', lat: 28.6139, lon: 77.2090 },
  { country: 'VN', name: 'Vietnam', lat: 21.0278, lon: 105.8342 },
];
let fallbackIdx = 0;

function resolveGeo(ip) {
  // geoip-lite returns null for private/localhost IPs
  const geo = geoip.lookup(ip);

  if (geo && geo.country && geo.ll && geo.ll.length === 2) {
    return {
      country: geo.country,
      name: geo.country,
      lat: geo.ll[0],
      lon: geo.ll[1],
    };
  }

  // Fallback: cycle through known threat-origin countries so self-testing
  // produces visible arcs from different parts of the world
  const fb = FALLBACKS[fallbackIdx % FALLBACKS.length];
  fallbackIdx++;
  return fb;
}

/**
 * POST /api/honeypot/event
 * Ingestion endpoint for honeypot services (Cowrie, web honeypot, etc.)
 * GeoIP-resolves the source IP and broadcasts via WebSocket.
 */
router.post('/event', async (req, res) => {
  const { sourceIp, attackType, protocol, port, payload } = req.body;

  if (!sourceIp || !attackType) {
    return res.status(400).json({ error: 'sourceIp and attackType are required' });
  }

  const geo = resolveGeo(sourceIp);

  const attack = {
    id: `hp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceIp,
    sourceCountry: geo.country,
    sourceCountryName: geo.name,
    sourceLat: geo.lat,
    sourceLon: geo.lon,
    destLat: 48.8566,
    destLon: 2.3522,
    attackType,
    protocol: protocol || 'TCP',
    port: port || 0,
    severity: 'medium',
    payload: payload || null,
    timestamp: Date.now(),
  };

  const stored = await addAttack(attack);

  log.info('event', `${attackType} from ${sourceIp} (${geo.country}: ${geo.lat.toFixed(1)}°, ${geo.lon.toFixed(1)}°) → port ${attack.port}`);

  // Broadcast to dashboard
  const io = getIo();
  if (io) {
    io.emit('new_attack', stored);
  }

  res.json({ status: 'ok', id: stored.id, geo: { country: geo.country, lat: geo.lat, lon: geo.lon } });
});

export default router;
