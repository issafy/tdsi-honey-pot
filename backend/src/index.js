import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import attacksRouter from './routes/attacks.js';
import statsRouter from './routes/stats.js';
import honeypotRouter from './routes/honeypot.js';
import { startGenerator } from './services/attackGenerator.js';
import { init as initDb, healthCheck as dbHealthCheck } from './services/db.js';
import { createLogger } from './utils/logger.js';

const log = createLogger('server');
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
});

// Export io instance for the attack generator
export function getIo() {
  return io;
}

// --- Middleware ---
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// HTTP request logging
app.use(morgan(':date[iso] [:method] :url :status :res[content-length] - :response-time ms', {
  stream: { write: (msg) => log.info('http', msg.trim()) },
}));

// --- Routes ---
app.use('/api/attacks', attacksRouter);
app.use('/api/stats', statsRouter);
app.use('/api/honeypot', honeypotRouter);

// Health check
app.get('/api/health', async (req, res) => {
  const dbOk = await dbHealthCheck().catch(() => false);
  res.json({ status: dbOk ? 'ok' : 'degraded', uptime: process.uptime(), db: dbOk });
});

// --- WebSocket ---
io.on('connection', (socket) => {
  log.info('ws', `Client connected: ${socket.id} (total: ${io.engine.clientsCount})`);

  socket.on('disconnect', (reason) => {
    log.info('ws', `Client disconnected: ${socket.id} reason=${reason} (remaining: ${io.engine.clientsCount})`);
  });
});

// --- Start ---
try {
  await initDb();

  const MOCK_ENABLED = process.env.MOCK_ENABLED === 'true';
  if (MOCK_ENABLED) {
    startGenerator();
    log.info('generator', 'Mock attack generator started (MOCK_ENABLED=true)');
  } else {
    log.info('generator', 'Mock generator disabled — waiting for real honeypot events');
  }

  httpServer.listen(PORT, () => {
    log.info('server', `Listening on http://0.0.0.0:${PORT} | WebSocket ready | CORS: ${CORS_ORIGIN}`);
  });
} catch (err) {
  log.error('server', 'Failed to initialize database — exiting', err);
  process.exit(1);
}
