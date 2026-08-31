// ============================================================================
// src/docs/paths/reminders.paths.js — /api/v1/reminders
//
// IMPORTANT: this backend does NOT send push notifications. These endpoints
// only store reminder data (when + what message); the mobile app is
// responsible for reading it and scheduling its own local OS notification.
// See src/services/reminderService.js.
// ============================================================================

const { successEnvelope, commonErrorResponses } = require('../components/envelope');
const { idPathParam } = require('../components/parameters');

module.exports = {
  '/reminders': {
    get: {
      tags: ['Reminders'],
      summary: "List all of the current user's reminders",
      description:
        'Reminders have no `user_id` column of their own — ownership is always established ' +
        'by joining through the parent debt, so this list is implicitly scoped to debts the ' +
        'current user owns. Ordered by `remind_at` ascending.',
      responses: {
        200: {
          description: 'Reminders across all of the user\'s debts.',
          content: {
            'application/json': {
              schema: successEnvelope({ type: 'array', items: { $ref: '#/components/schemas/Reminder' } }),
            },
          },
        },
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
    post: {
      tags: ['Reminders'],
      summary: 'Create a reminder for a debt',
      description:
        "Verifies `debt_id` refers to a debt owned by the current user before creating the " +
        'reminder (404 otherwise). A debt can have multiple reminders — e.g. one 3 days ' +
        'before the due date and one on the due date itself.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['debt_id', 'remind_at', 'message'],
              properties: {
                debt_id: { type: 'integer', example: 7 },
                remind_at: {
                  type: 'string',
                  format: 'date-time',
                  description: 'ISO 8601 datetime for when the app should fire the local notification.',
                  example: '2026-09-12T09:00:00.000Z',
                },
                message: { type: 'string', minLength: 1, maxLength: 300, example: 'Pay Karim back before Sept 15' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The created reminder.',
          content: { 'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/Reminder' }) } },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        404: {
          description: 'debt_id does not refer to a debt owned by the current user.',
        },
        500: commonErrorResponses[500],
      },
    },
  },

  '/reminders/{id}': {
    patch: {
      tags: ['Reminders'],
      summary: 'Reschedule or edit a reminder',
      parameters: [idPathParam('reminder', 4)],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                remind_at: { type: 'string', format: 'date-time' },
                message: { type: 'string', minLength: 1, maxLength: 300 },
                is_sent: {
                  type: 'boolean',
                  description: 'The app can mark a reminder as delivered/acknowledged locally.',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated reminder.',
          content: { 'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/Reminder' }) } },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    delete: {
      tags: ['Reminders'],
      summary: 'Cancel a reminder',
      parameters: [idPathParam('reminder', 4)],
      responses: {
        200: {
          description: 'Deleted.',
          content: { 'application/json': { schema: successEnvelope({ type: 'null' }) } },
        },
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
  },
};
