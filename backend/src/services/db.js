import pg from 'pg';
import { createLogger } from '../utils/logger.js';

const log = createLogger('db');

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'honeypot',
  user: process.env.DB_USER || 'honeypot',
  password: process.env.DB_PASSWORD || 'honeypot123',
  max: 10,
  idleTimeoutMillis: 30_000,
  // Retry connection on startup
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  log.error('pool', `Unexpected pool error: ${err.message}`, err);
});

async function retry(fn, label, maxAttempts = 10, delayMs = 1_000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      log.warn(label, `Attempt ${attempt}/${maxAttempts} failed: ${err.message} — retrying in ${delayMs}ms`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/**
 * Run migrations — idempotent CREATE TABLE IF NOT EXISTS.
 * Retries up to 10 times while Postgres is starting up.
 */
export async function init() {
  await retry(async () => {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS attacks (
          id          TEXT PRIMARY KEY,
          source_ip   TEXT NOT NULL,
          source_country TEXT NOT NULL DEFAULT '',
          source_country_name TEXT NOT NULL DEFAULT '',
          source_lat  DOUBLE PRECISION NOT NULL DEFAULT 0,
          source_lon  DOUBLE PRECISION NOT NULL DEFAULT 0,
          dest_lat    DOUBLE PRECISION NOT NULL DEFAULT 48.8566,
          dest_lon    DOUBLE PRECISION NOT NULL DEFAULT 2.3522,
          attack_type TEXT NOT NULL,
          protocol    TEXT NOT NULL DEFAULT 'TCP',
          port        INTEGER NOT NULL DEFAULT 0,
          severity    TEXT NOT NULL DEFAULT 'medium',
          payload     TEXT,
          timestamp   BIGINT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_attacks_timestamp ON attacks (timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_attacks_country   ON attacks (source_country);
      `);

      const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM attacks');
      log.info('init', `PostgreSQL connected — ${rows[0].count} attacks stored`);
    } finally {
      client.release();
    }
  }, 'db-init');
}

/**
 * Test connectivity — used by the health-check endpoint.
 */
export async function healthCheck() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}

export function getPool() {
  return pool;
}
