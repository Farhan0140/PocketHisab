// ============================================================================
// index.js
//
// The actual process entrypoint (`npm start` / `npm run dev` both run this
// file). Its only job is to load the already-built Express app
// (src/app.js) and start listening — all real setup (middleware, routes)
// lives in src/app.js so it can be imported elsewhere without side effects.
// ============================================================================

const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');

const server = app.listen(env.port, () => {
  logger.info(`PocketHisab API listening on port ${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown: on SIGTERM/SIGINT (e.g. Ctrl+C, or a process manager
// stopping the service), stop accepting new connections and let in-flight
// requests finish before exiting, instead of dropping them abruptly.
function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
