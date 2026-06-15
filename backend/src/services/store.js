// In-memory attack store — no database needed for now
import { createLogger } from '../utils/logger.js';

const log = createLogger('store');
const MAX_ATTACKS = 1000;

const attacks = [];
const countryCounts = new Map(); // iso2 -> count

export function addAttack(attack) {
  attacks.push(attack);

  // Evict oldest if over limit
  if (attacks.length > MAX_ATTACKS) {
    const removed = attacks.splice(0, attacks.length - MAX_ATTACKS);
    log.debug('evict', `Evicted ${removed.length} old attacks (store at ${attacks.length})`);
  }

  // Update country counts
  const prev = countryCounts.get(attack.sourceCountry) || 0;
  countryCounts.set(attack.sourceCountry, prev + 1);

  return attack;
}

export function getAttacks(limit = 50) {
  return attacks.slice(-limit).reverse();
}

export function getStats() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneMinuteAgo = now - 60 * 1000;

  const lastHour = attacks.filter((a) => a.timestamp > oneHourAgo);
  const lastMinute = attacks.filter((a) => a.timestamp > oneMinuteAgo);

  const uniqueSources = new Set(lastHour.map((a) => a.sourceCountry));

  // Top 10 countries
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({ country, count }));

  return {
    totalAttacks: attacks.length,
    activeSources: uniqueSources.size,
    attacksLastHour: lastHour.length,
    attacksPerMinute: lastMinute.length,
    topCountries,
  };
}
