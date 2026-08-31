// ============================================================================
// src/docs/paths/auth.paths.js — /api/v1/auth
//
// There are deliberately no /auth/register, /auth/login, /auth/logout, or
// /auth/reset-password paths documented here — see auth.routes.js: those
// flows are handled entirely by Firebase Authentication on the client
// (Email/Password + Google sign-in). This API only exposes profile
// read/update, and the very first authenticated request from a brand-new
// Firebase user silently creates their `users` row.
// ============================================================================

const { successEnvelope, commonErrorResponses } = require('../components/envelope');

module.exports = {
  '/auth/me': {
    get: {
      tags: ['Auth'],
      summary: "Get the current user's profile",
      description:
        'Returns the `users` row belonging to whoever the Bearer token identifies. If this ' +
        'is the very first request this Firebase account has ever made to the API, the row ' +
        'was just auto-created (with `name: null` and the default currency) by the auth ' +
        'middleware moments before this handler ran.',
      responses: {
        200: {
          description: 'The current user profile.',
          content: {
            'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/User' }) },
          },
        },
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    patch: {
      tags: ['Auth'],
      summary: "Update the current user's profile",
      description:
        'Updates editable profile fields. `email` cannot be changed here (it is owned by ' +
        'Firebase — change it through Firebase Auth on the client instead) and neither can ' +
        '`cached_balance` (only ever written by the balance service). At least one field ' +
        'must be supplied.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 1, maxLength: 100, example: 'Rahim Uddin' },
                currency: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 3,
                  description: 'ISO 4217 currency code. Automatically upper-cased.',
                  example: 'USD',
                },
              },
            },
            example: { currency: 'usd' },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated user profile.',
          content: {
            'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/User' }) },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
  },
};
