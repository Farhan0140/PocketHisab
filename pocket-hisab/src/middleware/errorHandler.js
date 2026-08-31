// ============================================================================
// src/middleware/errorHandler.js
//
// The LAST piece of middleware in the chain (see src/app.js). Express
// recognizes it as an error handler purely because it declares 4 parameters
// (err, req, res, next) — that signature is required even though `next` is
// unused, or Express will treat it as a normal (non-error) middleware.
//
// Every error in the app ends up here, either because a controller threw an
// ApiError (see src/utils/ApiError.js) or because something unexpected blew
// up (a bug, a network hiccup, a raw Postgres error). This is the ONE place
// that decides the final status code + response body, so no other file
// needs to worry about response formatting when something goes wrong.
// ============================================================================

const { ApiError } = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

// A handful of well-known Postgres error codes we can translate into a
// friendlier HTTP status instead of a generic 500. Full list:
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const POSTGRES_ERROR_STATUS = {
  '23505': 409, // unique_violation
  '23503': 400, // foreign_key_violation
  '23514': 400, // check_violation
};

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err && POSTGRES_ERROR_STATUS[err.code]) {
    statusCode = POSTGRES_ERROR_STATUS[err.code];
    message = 'The request conflicts with existing data or violates a data constraint.';
  }

  // Always log the full error server-side, even when we return a generic
  // message to the client (never leak internal error details/stack traces
  // in the HTTP response — that's an information-disclosure risk).
  if (statusCode >= 500) {
    logger.error(err);
  } else {
    logger.warn(`${statusCode} ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      details,
      // Stack traces are only ever included outside production, purely as
      // a local-development convenience.
      stack: env.isProduction ? undefined : err.stack,
    },
    meta: null,
  });
}

module.exports = errorHandler;
