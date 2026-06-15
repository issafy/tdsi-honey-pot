// Simple structured logger with timestamps and levels
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function format(level, tag, msg, data) {
  const base = `[${timestamp()}] [${level.toUpperCase().padEnd(5)}] [${tag}] ${msg}`;
  if (data !== undefined) {
    if (data instanceof Error) {
      return `${base} — ${data.message}\n${data.stack || ''}`;
    }
    return `${base} — ${typeof data === 'string' ? data : JSON.stringify(data)}`;
  }
  return base;
}

export const logger = {
  debug: (tag, msg, data) => {
    if (currentLevel <= LEVELS.debug) console.debug(format('debug', tag, msg, data));
  },
  info: (tag, msg, data) => {
    if (currentLevel <= LEVELS.info) console.log(format('info', tag, msg, data));
  },
  warn: (tag, msg, data) => {
    if (currentLevel <= LEVELS.warn) console.warn(format('warn', tag, msg, data));
  },
  error: (tag, msg, data) => {
    if (currentLevel <= LEVELS.error) console.error(format('error', tag, msg, data));
  },
};

// Pre-bound loggers per module
export function createLogger(tag) {
  return {
    debug: (msg, data) => logger.debug(tag, msg, data),
    info: (msg, data) => logger.info(tag, msg, data),
    warn: (msg, data) => logger.warn(tag, msg, data),
    error: (msg, data) => logger.error(tag, msg, data),
  };
}
