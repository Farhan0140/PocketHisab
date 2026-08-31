// ============================================================================
// src/docs/paths/debts.paths.js — /api/v1/debts
// ============================================================================

const { successEnvelope, paginatedEnvelope, commonErrorResponses } = require('../components/envelope');
const { pageParam, limitParam, idPathParam } = require('../components/parameters');

module.exports = {
  '/debts/upcoming': {
    get: {
      tags: ['Debts'],
      summary: 'Debts due soon',
      description:
        'Debts with `remaining_amount > 0` and a `due_date` within the next `days` days ' +
        '(inclusive of overdue-but-unpaid debts, since an overdue debt is by definition ' +
        'also "due"). Powers the "upcoming reminders" widget. Not paginated — this list is ' +
        'meant to be short by nature.',
      parameters: [
        {
          name: 'days',
          in: 'query',
          required: false,
          description: 'How many days ahead to look. Defaults to 7.',
          schema: { type: 'integer', minimum: 1, maximum: 365, default: 7 },
        },
      ],
      responses: {
        200: {
          description: 'Debts due within the window.',
          content: {
            'application/json': {
              schema: successEnvelope({ type: 'array', items: { $ref: '#/components/schemas/Debt' } }),
            },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
  },

  '/debts': {
    get: {
      tags: ['Debts'],
      summary: 'List debts',
      description:
        'Paginated list of the current user\'s debts, ordered by `due_date` ascending. The ' +
        '`status` field on every row (and the optional `?status=` filter) is the EFFECTIVE ' +
        'status, derived at read time rather than trusted blindly from the database column, ' +
        'because "is this overdue?" can become true purely from the passage of time with no ' +
        'write ever happening. Precedence (checked in this order): `remaining_amount <= 0` ' +
        '→ **paid**; else `due_date` is in the past → **overdue**; else ' +
        '`remaining_amount < amount` → **partially_paid**; else **pending**. Filtering by ' +
        '`?status=` is applied against this same effective value, not the raw column.',
      parameters: [
        {
          name: 'status',
          in: 'query',
          required: false,
          description: 'Filter by EFFECTIVE status (see description above).',
          schema: { type: 'string', enum: ['pending', 'partially_paid', 'paid', 'overdue'] },
        },
        pageParam,
        limitParam,
      ],
      responses: {
        200: {
          description: 'A page of debts.',
          content: {
            'application/json': { schema: paginatedEnvelope({ $ref: '#/components/schemas/Debt' }) },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
    post: {
      tags: ['Debts'],
      summary: 'Create a debt',
      description:
        '`remaining_amount` is always initialized equal to `amount` (nothing repaid yet) ' +
        'and cannot be set directly — it only ever changes via ' +
        'POST /debts/{id}/repayments.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['person_name', 'amount'],
              properties: {
                person_name: { type: 'string', minLength: 1, maxLength: 150, example: 'Karim' },
                amount: { type: 'number', exclusiveMinimum: 0, example: 5000 },
                note: { type: 'string', maxLength: 500, nullable: true, example: 'Phone repair' },
                due_date: { type: 'string', format: 'date', nullable: true, example: '2026-09-15' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The created debt.',
          content: { 'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/Debt' }) } },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
  },

  '/debts/{id}': {
    get: {
      tags: ['Debts'],
      summary: 'Get one debt, including its full repayment history',
      parameters: [idPathParam('debt', 7)],
      responses: {
        200: {
          description: 'The debt with its repayments.',
          content: {
            'application/json': {
              schema: successEnvelope({ $ref: '#/components/schemas/DebtWithRepayments' }),
            },
          },
        },
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    patch: {
      tags: ['Debts'],
      summary: "Edit a debt's details",
      description:
        'Only `person_name`, `note`, and `due_date` can be edited here. `amount`, ' +
        '`remaining_amount`, and `status` are intentionally NOT editable through this ' +
        'endpoint — the repayment ledger (POST /debts/{id}/repayments) is the only way ' +
        'those change, so the numbers can never drift out of sync with the recorded ' +
        'repayment history.',
      parameters: [idPathParam('debt', 7)],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                person_name: { type: 'string', minLength: 1, maxLength: 150 },
                note: { type: 'string', maxLength: 500, nullable: true },
                due_date: { type: 'string', format: 'date', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'The updated debt.',
          content: { 'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/Debt' }) } },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    delete: {
      tags: ['Debts'],
      summary: 'Delete a debt',
      description: 'Also deletes all of its repayments and reminders (`ON DELETE CASCADE`).',
      parameters: [idPathParam('debt', 7)],
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

  '/debts/{id}/repayments': {
    get: {
      tags: ['Debts'],
      summary: 'List repayment history for a debt',
      parameters: [idPathParam('debt', 7)],
      responses: {
        200: {
          description: 'Repayments, most recent first.',
          content: {
            'application/json': {
              schema: successEnvelope({ type: 'array', items: { $ref: '#/components/schemas/DebtRepayment' } }),
            },
          },
        },
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    post: {
      tags: ['Debts'],
      summary: 'Log a repayment (full or partial)',
      description:
        'Atomically (inside a DB transaction with a row lock on the debt, so two concurrent ' +
        'repayment requests can never double-spend the same remaining balance): inserts a ' +
        '`debt_repayments` row, decrements `remaining_amount` by `amount`, and sets `status` ' +
        'to `paid` (if the new remaining amount is `<= 0`) or `partially_paid` otherwise. ' +
        '**Overpayment is rejected**: if `amount` exceeds the debt\'s current ' +
        '`remaining_amount`, the request fails with 400 rather than allowing the debt to go ' +
        'negative or create a "credit".',
      parameters: [idPathParam('debt', 7)],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amount'],
              properties: {
                amount: { type: 'number', exclusiveMinimum: 0, example: 1000 },
                repaid_date: {
                  type: 'string',
                  format: 'date',
                  description: 'Defaults to today if omitted.',
                  example: '2026-08-20',
                },
                note: { type: 'string', maxLength: 500, nullable: true, example: 'Paid via bKash' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The updated debt and the newly created repayment.',
          content: {
            'application/json': {
              schema: successEnvelope({
                type: 'object',
                properties: {
                  debt: { $ref: '#/components/schemas/Debt' },
                  repayment: { $ref: '#/components/schemas/DebtRepayment' },
                },
              }),
            },
          },
        },
        400: {
          description: 'Validation failure OR the repayment amount exceeds the remaining balance (overpayment).',
          content: {
            'application/json': {
              example: {
                success: false,
                data: null,
                error: {
                  message: 'Repayment amount (999) cannot exceed the remaining balance (300.00).',
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
