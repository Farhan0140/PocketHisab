// ============================================================================
// src/docs/paths/transactions.paths.js — /api/v1/transactions
//
// Both "Add Money" and "Spend Money" in the mobile app call the SAME
// POST /transactions endpoint — the only difference is the `type` field
// they send ("income" vs "expense"). See createTransactionSchema in
// src/validators/transactionValidators.js for the exact validation rules.
// ============================================================================

const { successEnvelope, paginatedEnvelope, commonErrorResponses } = require('../components/envelope');
const { pageParam, limitParam, idPathParam } = require('../components/parameters');

const createOrUpdateBodyBase = {
  type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
  amount: { type: 'number', format: 'decimal', minimum: 0, exclusiveMinimum: true, example: 250 },
  category_id: {
    type: 'integer',
    nullable: true,
    description: 'Required when type=expense. Must be omitted/null when type=income.',
    example: 3,
  },
  note: { type: 'string', maxLength: 500, nullable: true, example: 'Lunch with the team' },
  transaction_date: {
    type: 'string',
    format: 'date',
    description: 'Defaults to today (server date) if omitted.',
    example: '2026-08-31',
  },
};

module.exports = {
  '/transactions/summary': {
    get: {
      tags: ['Transactions'],
      summary: 'Aggregated totals for a day / month / year',
      description:
        'Sums income and expense transactions within a single calendar period containing ' +
        '`date` (or today, if `date` is omitted), bucketed by `period`. Powers the ' +
        'Today/This Month/This Year toggle views on the History screen. Unlike ' +
        '`/dashboard/summary` (which always returns all three periods relative to *now*), ' +
        'this lets the client ask about an arbitrary past period, e.g. `period=month&date=2026-07-15` ' +
        'for July 2026.',
      parameters: [
        {
          name: 'period',
          in: 'query',
          required: false,
          description: 'Which calendar period to bucket by. Defaults to "month".',
          schema: { type: 'string', enum: ['day', 'month', 'year'], default: 'month' },
        },
        {
          name: 'date',
          in: 'query',
          required: false,
          description: 'Any date inside the target period. Defaults to today.',
          schema: { type: 'string', format: 'date', example: '2026-08-15' },
        },
      ],
      responses: {
        200: {
          description: 'Aggregated totals for the requested period.',
          content: {
            'application/json': {
              schema: successEnvelope({
                type: 'object',
                properties: {
                  period: { type: 'string', example: 'month' },
                  reference_date: { type: 'string', format: 'date', example: '2026-08-31' },
                  income_total: { type: 'number', example: 3000 },
                  expense_total: { type: 'number', example: 450.75 },
                  net_total: { type: 'number', example: 2549.25 },
                  transaction_count: { type: 'integer', example: 12 },
                },
              }),
            },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
  },

  '/transactions/summary/by-category': {
    get: {
      tags: ['Transactions'],
      summary: 'Expense totals grouped by category',
      description:
        'Aggregates EXPENSE transactions only (income has no category) grouped by ' +
        'category, sorted by total amount descending. Powers the pie chart on the History ' +
        'screen. Optionally narrow the range with `start_date`/`end_date`.',
      parameters: [
        {
          name: 'start_date',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'date' },
        },
        { name: 'end_date', in: 'query', required: false, schema: { type: 'string', format: 'date' } },
      ],
      responses: {
        200: {
          description: 'Per-category expense totals.',
          content: {
            'application/json': {
              schema: successEnvelope({
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category_id: { type: 'integer', nullable: true, example: 3 },
                    category_name: { type: 'string', nullable: true, example: 'Food' },
                    category_icon: { type: 'string', nullable: true, example: '🍔' },
                    category_color: { type: 'string', nullable: true, example: '#F97316' },
                    total_amount: { type: 'number', example: 1250.5 },
                    transaction_count: { type: 'integer', example: 8 },
                  },
                },
              }),
            },
          },
        },
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
  },

  '/transactions': {
    get: {
      tags: ['Transactions'],
      summary: 'List transactions (History screen)',
      description:
        'Paginated, filterable list of the current user\'s transactions, most recent ' +
        '`transaction_date` first. `search` performs a case-insensitive partial match ' +
        'against the `note` field.',
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: { type: 'string', enum: ['income', 'expense'] },
        },
        { name: 'category_id', in: 'query', required: false, schema: { type: 'integer' } },
        { name: 'start_date', in: 'query', required: false, schema: { type: 'string', format: 'date' } },
        { name: 'end_date', in: 'query', required: false, schema: { type: 'string', format: 'date' } },
        {
          name: 'search',
          in: 'query',
          required: false,
          description: 'Case-insensitive partial match against the note field.',
          schema: { type: 'string', maxLength: 200 },
        },
        pageParam,
        limitParam,
      ],
      responses: {
        200: {
          description: 'A page of transactions.',
          content: {
            'application/json': { schema: paginatedEnvelope({ $ref: '#/components/schemas/Transaction' }) },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
    post: {
      tags: ['Transactions'],
      summary: 'Create a transaction ("Add Money" / "Spend Money")',
      description:
        'Both the "Add Money" and "Spend Money" buttons in the app call this same ' +
        'endpoint — send `type: "income"` for Add Money or `type: "expense"` for Spend ' +
        'Money. `category_id` is required for expense and forbidden for income (enforced ' +
        'by the request schema). Runs inside a database transaction that also recomputes ' +
        'and caches the user\'s balance, so the new row and the cached balance can never ' +
        'drift apart.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'amount'],
              properties: createOrUpdateBodyBase,
            },
            examples: {
              spendMoney: {
                summary: 'Spend Money (expense)',
                value: { type: 'expense', amount: 250, category_id: 3, note: 'Lunch', transaction_date: '2026-08-31' },
              },
              addMoney: {
                summary: 'Add Money (income)',
                value: { type: 'income', amount: 15000, note: 'Salary', transaction_date: '2026-08-31' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'The created transaction.',
          content: {
            'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/Transaction' }) },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
  },

  '/transactions/{id}': {
    get: {
      tags: ['Transactions'],
      summary: 'Get one transaction',
      parameters: [idPathParam('transaction', 42)],
      responses: {
        200: {
          description: 'The transaction.',
          content: {
            'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/Transaction' }) },
          },
        },
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    patch: {
      tags: ['Transactions'],
      summary: 'Edit a transaction',
      description:
        'Partial update — send only the fields you want to change. The updated data is ' +
        'merged onto the existing row before the income/expense <-> category_id rule is ' +
        're-checked, so e.g. flipping `type` from "expense" to "income" without also ' +
        'clearing `category_id` is handled automatically (category_id is forced to null). ' +
        'Also recomputes the cached balance in the same database transaction as the update.',
      parameters: [idPathParam('transaction', 42)],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object', properties: createOrUpdateBodyBase } } },
      },
      responses: {
        200: {
          description: 'The updated transaction.',
          content: {
            'application/json': { schema: successEnvelope({ $ref: '#/components/schemas/Transaction' }) },
          },
        },
        400: commonErrorResponses[400],
        401: commonErrorResponses[401],
        404: commonErrorResponses[404],
        500: commonErrorResponses[500],
      },
    },
    delete: {
      tags: ['Transactions'],
      summary: 'Delete a transaction',
      description: "Deletes the row and recomputes/caches the user's balance in the same database transaction.",
      parameters: [idPathParam('transaction', 42)],
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
