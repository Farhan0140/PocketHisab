// ============================================================================
// src/docs/paths/export.paths.js — /api/v1/export
//
// The one pair of endpoints in this API that do NOT return the standard
// { success, data, error, meta } JSON envelope — they return an actual
// downloadable file (see src/controllers/export.controller.js).
// ============================================================================

module.exports = {
  '/export/transactions': {
    get: {
      tags: ['Export'],
      summary: 'Export transaction history as CSV or PDF',
      description:
        'Streams every transaction the user has (no pagination) as a downloadable file. ' +
        'The CSV is hand-generated (no external dependency); the PDF is streamed directly ' +
        'via `pdfkit` as it is built, rather than buffered in memory first. Response is a ' +
        'raw file with a `Content-Disposition: attachment` header, not the JSON envelope.',
      parameters: [
        {
          name: 'format',
          in: 'query',
          required: false,
          description: 'Defaults to csv.',
          schema: { type: 'string', enum: ['csv', 'pdf'], default: 'csv' },
        },
      ],
      responses: {
        200: {
          description: 'The exported file.',
          content: {
            'text/csv': { schema: { type: 'string', format: 'binary' } },
            'application/pdf': { schema: { type: 'string', format: 'binary' } },
          },
        },
        400: {
          description: 'Unsupported format (anything other than csv/pdf).',
        },
        401: {
          description: 'Missing, malformed, or invalid/expired Firebase ID token.',
        },
        500: { description: 'Unexpected server error.' },
      },
    },
  },
  '/export/full-backup': {
    get: {
      tags: ['Export'],
      summary: "Export a full JSON backup of everything the user owns",
      description:
        'A single JSON file containing the profile, custom categories (global defaults are ' +
        're-seeded fresh in any environment, so they are intentionally excluded), all ' +
        'transactions, debts + repayments, reminders, and savings pots + history. Returned ' +
        'as a downloadable `pockethisab-backup.json` attachment rather than the standard ' +
        'envelope.',
      responses: {
        200: {
          description: 'The full backup file.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  exported_at: { type: 'string', format: 'date-time' },
                  profile: { $ref: '#/components/schemas/User' },
                  categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                  transactions: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
                  debts: { type: 'array', items: { $ref: '#/components/schemas/Debt' } },
                  debt_repayments: { type: 'array', items: { $ref: '#/components/schemas/DebtRepayment' } },
                  reminders: { type: 'array', items: { $ref: '#/components/schemas/Reminder' } },
                  savings_pots: { type: 'array', items: { $ref: '#/components/schemas/SavingsPot' } },
                  savings_history: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/SavingsHistoryEntry' },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Missing, malformed, or invalid/expired Firebase ID token.',
        },
        500: { description: 'Unexpected server error.' },
      },
    },
  },
};
