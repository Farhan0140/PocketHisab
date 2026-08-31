// ============================================================================
// src/validators/debtValidators.js
// ============================================================================

const { z } = require('zod');

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date string in YYYY-MM-DD format');

const createDebtSchema = z.object({
  person_name: z.string().trim().min(1).max(150),
  amount: z.coerce.number().positive(),
  note: z.string().trim().max(500).optional().nullable(),
  due_date: dateString.optional().nullable(),
});

const updateDebtSchema = z
  .object({
    person_name: z.string().trim().min(1).max(150).optional(),
    note: z.string().trim().max(500).optional().nullable(),
    due_date: dateString.optional().nullable(),
    // Deliberately NOT allowing `amount`/`remaining_amount`/`status` to be
    // edited directly here — those only ever change through
    // POST /debts/:id/repayments, so the ledger of repayments always stays
    // consistent with the debt's remaining balance.
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

const createRepaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  repaid_date: dateString.optional(),
  note: z.string().trim().max(500).optional().nullable(),
});

const listDebtsQuerySchema = z.object({
  status: z.enum(['pending', 'partially_paid', 'paid', 'overdue']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

const upcomingQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(7),
});

module.exports = {
  createDebtSchema,
  updateDebtSchema,
  createRepaymentSchema,
  listDebtsQuerySchema,
  upcomingQuerySchema,
};
