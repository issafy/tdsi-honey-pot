import { io } from 'socket.io-client';
import { createLogger } from '../utils/logger';

const log = createLogger('socket');
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    log.info(`Connected: ${socket.id} → ${SOCKET_URL}`);
  });

  socket.on('disconnect', (reason) => {
    log.warn(`Disconnected: reason=${reason}`);
  });

  socket.on('connect_error', (err) => {
    log.error(`Connection error: ${err.message}`);
  });

  socket.io.on('reconnect_attempt', (attempt) => {
    log.info(`Reconnect attempt ${attempt}...`);
  });

  socket.io.on('reconnect', () => {
    log.info('Reconnected successfully');
  });

  socket.io.on('reconnect_failed', () => {
    log.error('All reconnect attempts failed');
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onNewAttack(callback) {
  const s = connectSocket();
  s.on('new_attack', callback);
  return () => s.off('new_attack', callback);
}
