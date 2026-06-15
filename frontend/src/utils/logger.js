// Browser console logger with timestamps, grouping, and level control
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS.info;

function timestamp() {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

const styles = {
  info: 'color: #00d4ff',
  warn: 'color: #f59e0b',
  error: 'color: #ef4444',
  debug: 'color: #6b7280',
};

export function createLogger(tag) {
  return {
    debug: (msg, data) => {
      if (currentLevel <= LEVELS.debug)
        console.debug(`%c[${timestamp()}] [DEBUG] [${tag}] ${msg}`, styles.debug, data ?? '');
    },
    info: (msg, data) => {
      if (currentLevel <= LEVELS.info)
        console.log(`%c[${timestamp()}] [INFO]  [${tag}] ${msg}`, styles.info, data ?? '');
    },
    warn: (msg, data) => {
      if (currentLevel <= LEVELS.warn)
        console.warn(`%c[${timestamp()}] [WARN]  [${tag}] ${msg}`, styles.warn, data ?? '');
    },
    error: (msg, data) => {
      if (currentLevel <= LEVELS.error)
        console.error(`%c[${timestamp()}] [ERROR] [${tag}] ${msg}`, styles.error, data ?? '');
    },
  };
}
