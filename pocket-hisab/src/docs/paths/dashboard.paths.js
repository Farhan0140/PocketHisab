// ============================================================================
// src/docs/paths/dashboard.paths.js — /api/v1/dashboard
// ============================================================================

const { successEnvelope, commonErrorResponses } = require('../components/envelope');

const periodTotals = {
  type: 'object',
  properties: {
    income_total: { type: 'number', format: 'decimal', example: 3000 },
    expense_total: { type: 'number', format: 'decimal', example: 450.75 },
    net_total: { type: 'number', format: 'decimal', example: 2549.25 },
  },
};

module.exports = {
  '/dashboard/summary': {
    get: {
      tags: ['Dashboard'],
      summary: "Today / this month / this year totals for the Home screen",
      description:
        'Returns three independent income/expense/net breakdowns in one call — for the ' +
        'current calendar day, the current calendar month, and the current calendar year, ' +
        'each computed with `date_trunc()` against `CURRENT_DATE` at request time. Powers ' +
        'the "Today / This Month / This Year" widgets on the Home screen without three ' +
        'separate round trips.',
      responses: {
        200: {
          description: 'Today/this-month/this-year totals.',
          content: {
            'application/json': {
              schema: successEnvelope({
                type: 'object',
                properties: {
                  today: periodTotals,
                  this_month: periodTotals,
                  this_year: periodTotals,
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
  '/dashboard/recent-activity': {
    get: {
      tags: ['Dashboard'],
      summary: 'Recent transactions feed',
      description:
        "The last N transactions (most recent `transaction_date` first, tie-broken by " +
        "id), each joined with its category so the client can render an icon/name without " +
        "a second request. Powers the Home screen's Recent Activity list.",
      parameters: [
        {
          name: 'limit',
          in: 'query',
          description: 'How many transactions to return. Defaults to 10, capped at 50.',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
        },
      ],
      responses: {
        200: {
          description: 'Recent transactions, most recent first.',
          content: {
            'application/json': {
              schema: successEnvelope({
                type: 'array',
                items: { $ref: '#/components/schemas/Transaction' },
              }),
            },
          },
        },
        401: commonErrorResponses[401],
        500: commonErrorResponses[500],
      },
    },
  },
};
