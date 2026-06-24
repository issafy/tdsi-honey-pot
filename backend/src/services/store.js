import { getPool } from './db.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('store');
const MAX_ATTACKS = 10_000; // soft cap enforced by periodic cleanup

export async function addAttack(attack) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO attacks (id, source_ip, source_country, source_country_name,
       source_lat, source_lon, dest_lat, dest_lon, attack_type, protocol,
       port, severity, payload, timestamp)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      attack.id,
      attack.sourceIp,
      attack.sourceCountry || '',
      attack.sourceCountryName || '',
      attack.sourceLat || 0,
      attack.sourceLon || 0,
      attack.destLat || 48.8566,
      attack.destLon || 2.3522,
      attack.attackType,
      attack.protocol || 'TCP',
      attack.port || 0,
      attack.severity || 'medium',
      attack.payload || null,
      attack.timestamp || Date.now(),
    ],
  );

  // Prune old rows beyond the soft cap every ~50 inserts (probabilistic)
  if (Math.random() < 0.02) {
    const { rows } = await pool.query(
      `DELETE FROM attacks WHERE id IN (
         SELECT id FROM attacks ORDER BY timestamp ASC
         OFFSET $1
       ) RETURNING id`,
      [MAX_ATTACKS],
    );
    if (rows.length > 0) {
      log.debug('evict', `Pruned ${rows.length} old attacks (cap=${MAX_ATTACKS})`);
    }
  }

  return attack;
}

/**
 * Map a PostgreSQL row (snake_case) to the camelCase shape the frontend expects.
 */
function rowToAttack(row) {
  return {
    id: row.id,
    sourceIp: row.source_ip,
    sourceCountry: row.source_country,
    sourceCountryName: row.source_country_name,
    sourceLat: row.source_lat,
    sourceLon: row.source_lon,
    destLat: row.dest_lat,
    destLon: row.dest_lon,
    attackType: row.attack_type,
    protocol: row.protocol,
    port: row.port,
    severity: row.severity,
    payload: row.payload,
    timestamp: row.timestamp,
  };
}

export async function getAttacks(limit = 50) {
  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT * FROM attacks ORDER BY timestamp DESC LIMIT $1',
    [Math.min(limit, 200)],
  );
  return rows.map(rowToAttack);
}

export async function getStats() {
  const pool = getPool();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneMinuteAgo = now - 60 * 1000;

  const [
    { rows: [totalRow] },
    { rows: [sourcesRow] },
    { rows: [lastHourRow] },
    { rows: [lastMinRow] },
    { rows: topCountries },
  ] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM attacks'),
    pool.query(
      'SELECT COUNT(DISTINCT source_country)::int AS count FROM attacks WHERE timestamp > $1',
      [oneHourAgo],
    ),
    pool.query(
      'SELECT COUNT(*)::int AS count FROM attacks WHERE timestamp > $1',
      [oneHourAgo],
    ),
    pool.query(
      'SELECT COUNT(*)::int AS count FROM attacks WHERE timestamp > $1',
      [oneMinuteAgo],
    ),
    pool.query(
      `SELECT source_country AS country, COUNT(*)::int AS count
       FROM attacks
       GROUP BY source_country
       ORDER BY count DESC
       LIMIT 10`,
    ),
  ]);

  return {
    totalAttacks: totalRow.count,
    activeSources: sourcesRow.count,
    attacksLastHour: lastHourRow.count,
    attacksPerMinute: lastMinRow.count,
    topCountries,
  };
}
