// ============================================================================
// src/middleware/pagination.js
//
// Normalizes the `page` and `limit` query params (present as strings, or
// missing entirely) into a consistent `req.pagination = { page, limit,
// offset }` object that every list-style service can use directly, e.g.
// `.limit(req.pagination.limit).offset(req.pagination.offset)`.
// ============================================================================

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function pagination(req, res, next) {
  const rawPage = Number(req.query.page);
  const rawLimit = Number(req.query.limit);

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  req.pagination = { page, limit, offset: (page - 1) * limit };
  next();
}

module.exports = pagination;
