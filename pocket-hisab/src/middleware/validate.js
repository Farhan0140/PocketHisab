// ============================================================================
// src/middleware/validate.js
//
// A generic middleware FACTORY (a function that returns a middleware
// function) for validating a request against a Zod schema. Used as:
//   router.post('/', validate(createTransactionSchema, 'body'), ...)
// If validation fails, it throws a BadRequestError with the Zod issues
// attached as `details`, which errorHandler turns into a 400 response — the
// controller never even runs. If validation succeeds, `req[source]` is
// REPLACED with the parsed/coerced data (e.g. numeric query strings become
// real numbers), so controllers can trust its shape completely.
// ============================================================================

const { BadRequestError } = require('../utils/ApiError');

/**
 * @param {import('zod').ZodType} schema - The Zod schema to validate against.
 * @param {'body' | 'query' | 'params'} [source] - Which part of the request to validate.
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      throw new BadRequestError('Request validation failed.', result.error.issues);
    }

    // req.query is defined by Express 5 as a getter-only property (it's
    // recomputed from the raw URL on every access), so a plain
    // `req.query = result.data` assignment silently does nothing. We have
    // to replace the property descriptor itself to actually swap in our
    // parsed/coerced data. req.body and req.params are ordinary writable
    // properties, so a normal assignment is fine for those.
    if (source === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else {
      req[source] = result.data;
    }

    next();
  };
}

module.exports = validate;
