// ============================================================================
// src/validators/transactionValidators.js
//
// The business rule "category_id is required for expense, forbidden for
// income" lives here (via Zod's `.superRefine`), since the database only
// enforces "if set, must reference a real category" — nullability alone
// can't express "required depending on another field's value".
// ============================================================================

const { z } = require('zod');

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date string in YYYY-MM-DD format');

function applyIncomeExpenseCategoryRule(data, ctx) {
  if (data.type === 'expense' && (data.category_id === undefined || data.category_id === null)) {
    ctx.addIssue({
      code: 'custom',
      path: ['category_id'],
      message: 'category_id is required for expense transactions.',
    });
  }
  if (data.type === 'income' && data.category_id != null) {
    ctx.addIssue({
      code: 'custom',
      path: ['category_id'],
      message: 'category_id must not be set for income transactions.',
    });
  }
}

const createTransactionSchema = z
  .object({
    type: z.enum(['income', 'expense']),
    amount: z.coerce.number().positive(),
    category_id: z.coerce.number().int().positive().optional().nullable(),
    note: z.string().trim().max(500).optional().nullable(),
    transaction_date: dateString.optional(),
  })
  .superRefine(applyIncomeExpenseCategoryRule);

// Updates allow changing amount/note/date/category freely, but if `type` is
// being changed too, the same income/expense <-> category_id rule must still
// hold against the FULL resulting object — the controller layer merges this
// with the existing row before persisting, so partial updates are safe.
const updateTransactionSchema = z
  .object({
    type: z.enum(['income', 'expense']).optional(),
    amount: z.coerce.number().positive().optional(),
    category_id: z.coerce.number().int().positive().optional().nullable(),
    note: z.string().trim().max(500).optional().nullable(),
    transaction_date: dateString.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

const listTransactionsQuerySchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  category_id: z.coerce.number().int().positive().optional(),
  start_date: dateString.optional(),
  end_date: dateString.optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

const summaryQuerySchema = z.object({
  period: z.enum(['day', 'month', 'year']).default('month'),
  date: dateString.optional(),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
  summaryQuerySchema,
};
