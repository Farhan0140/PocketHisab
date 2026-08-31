// ============================================================================
// src/middleware/notFoundHandler.js
//
// Mounted AFTER every real route in src/app.js. If a request reaches this
// point, no route matched the URL/method at all (as opposed to a route
// matching but the specific resource not existing, which is handled by
// NotFoundError thrown from a service/controller instead).
// ============================================================================

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    data: null,
    error: { message: `No route found for ${req.method} ${req.originalUrl}`, details: null },
    meta: null,
  });
}

module.exports = notFoundHandler;
