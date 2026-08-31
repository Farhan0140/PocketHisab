// ============================================================================
// src/middleware/asyncHandler.js
//
// Express does not automatically forward a rejected Promise (or a thrown
// error inside an `async` function) to error-handling middleware. This
// wrapper fixes that: every controller is registered as
// `asyncHandler(controllerFn)`, so if the controller (or anything it awaits,
// like a service call) throws or rejects, the error is caught here and
// passed to `next(err)`, where src/middleware/errorHandler.js takes over.
// Without this, an unhandled rejection inside a route would just hang the
// request instead of returning a proper error response.
// ============================================================================

/**
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<any>} fn
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
