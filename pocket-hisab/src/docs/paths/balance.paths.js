// ============================================================================
// src/docs/paths/balance.paths.js — /api/v1/balance
// ============================================================================

const { successEnvelope, commonErrorResponses } = require('../components/envelope');

module.exports = {
  '/balance': {
    get: {
      tags: ['Balance'],
      summary: 'Get the current Total Balance',
      description:
        'Total Balance is never stored as a single field the client can push a new value ' +
        'into — it is always computed server-side as `SUM(income transactions) - ' +
        'SUM(expense transactions)` over the entire ledger (see ' +
        '`src/services/balanceService.js`). This endpoint recomputes live on every call, so ' +
        'the number is always correct even if the denormalized `users.cached_balance` ' +
        'column were ever to drift.',
      responses: {
        200: {
          description: 'The current balance.',
          content: {
            'application/json': {
              schema: successEnvelope({
                type: 'object',
                properties: { balance: { type: 'number', format: 'decimal', example: 12500.5 } },
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
