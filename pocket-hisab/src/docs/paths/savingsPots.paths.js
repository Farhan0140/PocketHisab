// ============================================================================
// src/docs/paths/savingsPots.paths.js — /api/v1/savings-pots
// ============================================================================

const { successEnvelope, commonErrorResponses } = require('../components/envelope');
const { idPathParam } = require('../components/parameters');

module.exports = {
  '/savings-pots': {
    get: {
      tags: ['Savings Pots'],
      summary: 'List savings pots with a total summed figure',
      description:
        "Returns every pot the user has, plus `meta.total_saved` — the sum of every pot's " +
        '`current_amount`. Remember: savings pots are fully independent of Total Balance ' +
        '(see GET /balance) — this total is never added to or subtracted from it.',
      responses: {
        200: {
          description: 'Savings pots and their combined total.',
          content: {
            'application/json': {
              schema: successEnvelope(
                { type: 'array', items: { $ref: '#/components/schemas/SavingsPot' } },
                {
                  type: 'object',
                  properties: { total_saved: { type: 'number', format: 'decimal', example: 8000 } },
                }
              ),
            },
          },
        },
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
    post: {
      tags: ['Savings Pots'],
      summary: 'Create a savings pot',
      description: 'Starts at `current_amount: 0` — use POST /savings-pots/{id}/entries to add money to it.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string', minLength: 1, maxLength: 100, example: 'Emergency Fund' },
                icon: { type: 'string', maxLength: 20, nullable: true, example: '🏦' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The created pot.',
          content: {
            'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/SavingsPot' }) },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
  },

  '/savings-pots/{id}': {
    get: {
      tags: ['Savings Pots'],
      summary: 'Get a pot with its full deposit/withdrawal history',
      parameters: [idPathParam('savings pot', 2)],
      responses: {
        200: {
          description: 'The pot with its history.',
          content: {
            'application/json': {
              schema: successEnvelope({ $ref: '#/components/schemas/SavingsPotWithHistory' }),
            },
          },
        },
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    patch: {
      tags: ['Savings Pots'],
      summary: 'Edit a pot\'s title/icon',
      description:
        '`current_amount` cannot be edited directly here — it only ever changes through ' +
        'POST /savings-pots/{id}/entries, so the running total always stays consistent with ' +
        'the recorded deposit/withdrawal history.',
      parameters: [idPathParam('savings pot', 2)],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', minLength: 1, maxLength: 100 },
                icon: { type: 'string', maxLength: 20, nullable: true },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated pot.',
          content: {
            'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/SavingsPot' }) },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    delete: {
      tags: ['Savings Pots'],
      summary: 'Delete a pot',
      description: 'Also deletes its entire deposit/withdrawal history (`ON DELETE CASCADE`).',
      parameters: [idPathParam('savings pot', 2)],
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

  '/savings-pots/{id}/entries': {
    get: {
      tags: ['Savings Pots'],
      summary: 'List deposit/withdrawal history for a pot',
      parameters: [idPathParam('savings pot', 2)],
      responses: {
        200: {
          description: 'Entries, most recent first.',
          content: {
            'application/json': {
              schema: successEnvelope({ type: 'array', items: { $ref: '#/components/schemas/SavingsHistoryEntry' } }),
            },
          },
        },
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    post: {
      tags: ['Savings Pots'],
      summary: 'Add a deposit or withdrawal entry',
      description:
        'Atomically (DB transaction + row lock on the pot) inserts a `savings_history` row ' +
        'and adjusts the pot\'s `current_amount` up (deposit) or down (withdrawal). ' +
        '**Over-withdrawal is rejected**: a withdrawal larger than the pot\'s current ' +
        'balance fails with 400 rather than letting the pot go negative. This never touches ' +
        '`transactions` or Total Balance — see the schema note on SavingsPot.',
      parameters: [idPathParam('savings pot', 2)],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'amount'],
              properties: {
                type: { type: 'string', enum: ['deposit', 'withdrawal'], example: 'deposit' },
                amount: { type: 'number', exclusiveMinimum: 0, example: 500 },
                note: { type: 'string', maxLength: 500, nullable: true, example: 'Monthly top-up' },
                entry_date: { type: 'string', format: 'date', description: 'Defaults to today.', example: '2026-08-31' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The updated pot and the newly created entry.',
          content: {
            'application/json': {
              schema: successEnvelope({
                type: 'object',
                properties: {
                  pot: { $ref: '#/components/schemas/SavingsPot' },
                  entry: { $ref: '#/components/schemas/SavingsHistoryEntry' },
                },
              }),
            },
          },
        },
        400: {
          description: 'Validation failure OR a withdrawal exceeding the pot\'s current balance.',
          content: {
            'application/json': {
              example: {
                success: false,
                data: null,
                error: {
                  message: "Withdrawal amount (9999) cannot exceed the pot's current balance (300.00).",
                  details: null,
                },
                meta: null,
              },
            },
          },
        },
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
  },
};
