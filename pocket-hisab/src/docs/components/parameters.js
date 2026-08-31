// ============================================================================
// src/docs/components/parameters.js
//
// Small reusable OpenAPI parameter definitions shared across many paths —
// mirrors src/middleware/pagination.js in spirit: define the shape once.
// ============================================================================

const pageParam = {
  name: 'page',
  in: 'query',
  description: 'Page number, 1-indexed. Defaults to 1.',
  required: false,
  schema: { type: 'integer', minimum: 1, default: 1 },
};

const limitParam = {
  name: 'limit',
  in: 'query',
  description: 'Rows per page. Defaults to 20, capped at 100.',
  required: false,
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
};

function idPathParam(resourceName, example) {
  return {
    name: 'id',
    in: 'path',
    required: true,
    description: `The ${resourceName} id.`,
    schema: { type: 'integer', example },
  };
}

module.exports = { pageParam, limitParam, idPathParam };
