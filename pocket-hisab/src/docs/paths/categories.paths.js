// ============================================================================
// src/docs/paths/categories.paths.js — /api/v1/categories
// ============================================================================

const { successEnvelope, commonErrorResponses } = require('../components/envelope');
const { idPathParam } = require('../components/parameters');

module.exports = {
  '/categories': {
    get: {
      tags: ['Categories'],
      summary: "List categories available to the current user",
      description:
        "Returns the user's own custom categories PLUS every global default category " +
        '(`user_id: null`, seeded once via `npx knex seed:run`), filtered to `is_active: ' +
        'true` by default — the set a "choose a category" picker for a NEW transaction ' +
        'should offer. (Historical transactions still display their category correctly ' +
        'even after it is deactivated — that filtering only affects this listing endpoint, ' +
        'not existing transaction records.)',
      responses: {
        200: {
          description: 'Categories available to this user.',
          content: {
            'application/json': {
              schema: successEnvelope({ type: 'array', items: { $ref: '#/components/schemas/Category' } }),
            },
          },
        },
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
    post: {
      tags: ['Categories'],
      summary: 'Create a custom category',
      description: 'Creates a category owned by the current user (`is_default: false`, `is_active: true`).',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 60, example: 'Pet Care' },
                icon: { type: 'string', maxLength: 20, nullable: true, example: '🐾' },
                color: {
                  type: 'string',
                  pattern: '^#[0-9A-Fa-f]{6}$',
                  nullable: true,
                  description: 'Hex color code.',
                  example: '#22C55E',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The created category.',
          content: {
            'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/Category' }) },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
  },

  '/categories/{id}': {
    patch: {
      tags: ['Categories'],
      summary: 'Edit a custom category',
      description:
        'Only categories the current user owns can be edited. Attempting to edit a global ' +
        'default category (`user_id: null`) returns 403; attempting to edit another ' +
        "user's category returns 404 (so existence is never leaked across accounts).",
      parameters: [idPathParam('category', 12)],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 60 },
                icon: { type: 'string', maxLength: 20, nullable: true },
                color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated category.',
          content: {
            'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/Category' }) },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        403: {
          description: 'The category is a global default and cannot be modified.',
          content: {
            'application/json': {
              example: {
                success: false,
                data: null,
                error: { message: 'Default categories cannot be modified or deleted.', details: null },
                meta: null,
              },
            },
          },
        },
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    delete: {
      tags: ['Categories'],
      summary: 'Soft-delete a custom category',
      description:
        'ALWAYS a soft delete (`is_active` set to `false`) — the row is never removed from ' +
        'the database, so it never breaks the `category_id` foreign key on any transaction ' +
        'that already references it. The category simply stops appearing in ' +
        'GET /categories for new transactions. Same ownership rules as PATCH above (403 for ' +
        "a default category, 404 for another user's category).",
      parameters: [idPathParam('category', 12)],
      responses: {
        200: {
          description: 'Deactivated.',
          content: { 'application/json': { schema: successEnvelope({ type: 'null' }) } },
        },
        401: commonErrorResponses[401],
        403: {
          description: 'The category is a global default and cannot be deleted.',
        },
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
  },
};
