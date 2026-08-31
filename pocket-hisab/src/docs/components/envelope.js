// ============================================================================
// src/docs/components/envelope.js
//
// Every real response in this API (see src/utils/responseEnvelope.js and
// src/middleware/errorHandler.js) is wrapped in the same
// { success, data, error, meta } shape. Rather than typing that wrapper out
// by hand in all ~30 endpoint definitions, these helpers build it once from
// just the "data" schema — keeping the OpenAPI spec as DRY as the app code.
// ============================================================================

/**
 * Wraps a data schema (or `$ref`) in the standard success envelope.
 * @param {object} dataSchema - The OpenAPI schema for the `data` field.
 * @param {object} [metaSchema] - Optional schema for the `meta` field (defaults to null-only).
 */
function successEnvelope(dataSchema, metaSchema = { type: 'null' }) {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: dataSchema,
      error: { type: 'null', example: null },
      meta: metaSchema,
    },
  };
}

/** The envelope shape for a paginated list response (`meta` carries pagination info). */
function paginatedEnvelope(itemSchema) {
  return successEnvelope(
    { type: 'array', items: itemSchema },
    { $ref: '#/components/schemas/PaginationMeta' }
  );
}

/** A single standard { success: false, error: {...} } response used for every error status. */
function errorResponse(description, exampleMessage) {
  return {
    description,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            data: { type: 'null', example: null },
            error: { $ref: '#/components/schemas/ErrorObject' },
            meta: { type: 'null', example: null },
          },
        },
        example: {
          success: false,
          data: null,
          error: { message: exampleMessage, details: null },
          meta: null,
        },
      },
    },
  };
}

/**
 * The four error responses nearly every authenticated endpoint can return.
 * Individual path definitions can still add endpoint-specific ones (e.g. a
 * 409 on a unique-constraint conflict) on top of this shared set.
 */
const commonErrorResponses = {
  400: errorResponse(
    'Validation failed, or the request violates a business rule (e.g. overpaying a debt).',
    'Request validation failed.'
  ),
  401: errorResponse(
    'Missing, malformed, or invalid/expired Firebase ID token.',
    'Missing or malformed Authorization header. Expected "Bearer <token>".'
  ),
  404: errorResponse('The resource does not exist, or does not belong to the authenticated user.', 'Resource not found'),
  500: errorResponse('Unexpected server error.', 'Internal server error'),
};

module.exports = { successEnvelope, paginatedEnvelope, errorResponse, commonErrorResponses };
