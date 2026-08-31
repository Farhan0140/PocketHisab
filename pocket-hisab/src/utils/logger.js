// ============================================================================
// src/utils/logger.js
//
// A deliberately thin wrapper around console.* rather than a full logging
// library (pino/winston). The goal is just to give the rest of the codebase
// ONE import to log through (`require('../utils/logger')`), so swapping in a
// real structured logger later only means changing this one file.
// ============================================================================

const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

module.exports = logger;
