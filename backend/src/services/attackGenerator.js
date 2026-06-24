import { ATTACKERS, ATTACK_TYPES, TARGET } from '../data/fakeIPs.js';
import { addAttack } from './store.js';
import { getIo } from '../index.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('generator');

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAttack() {
  const attacker = randomFrom(ATTACKERS);
  const attackType = randomFrom(ATTACK_TYPES);

  return {
    id: `${Date.now()}-${randomInt(1000, 9999)}`,
    sourceIp: attacker.ip,
    sourceCountry: attacker.iso2,
    sourceCountryName: attacker.country,
    sourceLat: attacker.lat,
    sourceLon: attacker.lon,
    destLat: TARGET.lat,
    destLon: TARGET.lon,
    attackType: attackType.type,
    protocol: attackType.protocol,
    port: attackType.port,
    severity: attackType.severity,
    timestamp: Date.now(),
  };
}

let intervalId = null;
let attackCount = 0;

export function startGenerator() {
  if (intervalId) return;

  async function tick() {
    const count = randomInt(1, 3);
    for (let i = 0; i < count; i++) {
      const attack = generateAttack();
      await addAttack(attack);
      attackCount++;

      // Broadcast via WebSocket
      const io = getIo();
      if (io) {
        io.emit('new_attack', attack);
      }
    }

    // Log periodically (every ~50 attacks) to avoid noise
    if (attackCount % 50 < count) {
      log.debug('tick', `Generated ${attackCount} total attacks (${count} this tick)`);
    }

    // Schedule next tick with random delay
    const delay = randomInt(800, 3000);
    intervalId = setTimeout(tick, delay);
  }

  // First tick immediately
  tick();
}

export function stopGenerator() {
  if (intervalId) {
    clearTimeout(intervalId);
    intervalId = null;
    log.info('tick', 'Generator stopped');
  }
}
