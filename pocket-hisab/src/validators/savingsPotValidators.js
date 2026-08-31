// ============================================================================
// src/validators/savingsPotValidators.js
// ============================================================================

const { z } = require('zod');

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date string in YYYY-MM-DD format');

const createPotSchema = z.object({
  title: z.string().trim().min(1).max(100),
  icon: z.string().trim().max(20).optional().nullable(),
});

const updatePotSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    icon: z.string().trim().max(20).optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

const createEntrySchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.coerce.number().positive(),
  note: z.string().trim().max(500).optional().nullable(),
  entry_date: dateString.optional(),
});

module.exports = { createPotSchema, updatePotSchema, createEntrySchema };
