// ============================================================================
// src/utils/ApiError.js
//
// A small hierarchy of error classes that every service throws instead of
// generic `Error`. src/middleware/errorHandler.js knows how to turn any
// ApiError into the correct HTTP status code + the standard
// { success, data, error, meta } response envelope. Throwing a plain Error
// anywhere still works (errorHandler treats it as an unexpected 500), but
// using these gives callers precise, intentional status codes.
// ============================================================================

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code to respond with.
   * @param {string} message - Human-readable error message returned to the client.
   * @param {object} [details] - Optional extra machine-readable detail (e.g. Zod validation issues).
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details = null) {
    super(400, message, details);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
