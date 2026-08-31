// ============================================================================
// src/utils/responseEnvelope.js
//
// Every successful response from this API has the exact same shape:
//   { success: true, data: <payload>, error: null, meta: <pagination etc, or null> }
// Failures are built the same way but by src/middleware/errorHandler.js
// (success: false, data: null, error: {...}). Keeping both in this shared
// shape means the mobile client can handle every response uniformly.
// ============================================================================

/**
 * Send a successful JSON response in the standard envelope.
 *
 * @param {import('express').Response} res
 * @param {object} [options]
 * @param {*} [options.data] - The response payload (defaults to null).
 * @param {object} [options.meta] - Extra info such as pagination (defaults to null).
 * @param {number} [options.status] - HTTP status code (defaults to 200).
 */
function sendSuccess(res, { data = null, meta = null, status = 200 } = {}) {
  return res.status(status).json({ success: true, data, error: null, meta });
}

/**
 * Builds the standard pagination `meta` object attached to list responses.
 *
 * @param {{ page: number, limit: number }} pagination - From req.pagination (see src/middleware/pagination.js).
 * @param {number} totalCount - Total number of matching rows across all pages.
 */
function buildPaginationMeta({ page, limit }, totalCount) {
  return {
    total_count: totalCount,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(totalCount / limit)),
  };
}

module.exports = { sendSuccess, buildPaginationMeta };
