// ============================================================================
// src/middleware/requestLogger.js
//
// Development-only middleware that logs the full request for every API
// call — method, URL, headers, and request body — plus how long it took to
// respond, formatted as "Xms" under a second or "X.XXs" above it. Deliberately
// does NOT log the response body (kept out to avoid flooding the terminal
// and echoing financial data back out); morgan's one-line summary already
// covers the response status if that's needed.
//
// Never enabled in production (see src/app.js) — writing full request
// bodies (which include financial data) to stdout is a reasonable
// trade-off for local debugging, not for a real deployment.
// ============================================================================

const logger = require('../utils/logger');

const MAX_LOGGED_BODY_LENGTH = 2000;

/** Authorization carries a live Firebase ID token — never write the full value, even locally. */
function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  if (sanitized.authorization) sanitized.authorization = 'Bearer <redacted>';
  return sanitized;
}

function serializeBody(body) {
  if (body === undefined || body === null) return null;
  const serialized = typeof body === 'string' ? body : JSON.stringify(body);
  return serialized.length > MAX_LOGGED_BODY_LENGTH
    ? `${serialized.slice(0, MAX_LOGGED_BODY_LENGTH)}… (truncated, ${serialized.length} chars total)`
    : serialized;
}

/** "842ms" below one second, "1.34s" at or above it. */
function formatDuration(durationMs) {
  return durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(2)}s`;
}

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  logger.info(`--> ${req.method} ${req.originalUrl}`);
  logger.info('    headers:', JSON.stringify(sanitizeHeaders(req.headers)));
  if (req.body && Object.keys(req.body).length > 0) {
    logger.info('    request body:', serializeBody(req.body));
  }

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    logger.info(`<-- ${req.method} ${req.originalUrl} ${res.statusCode} (${formatDuration(durationMs)})`);
  });

  next();
}

module.exports = requestLogger;
