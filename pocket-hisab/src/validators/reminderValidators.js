// ============================================================================
// src/validators/reminderValidators.js
// ============================================================================

const { z } = require('zod');

const createReminderSchema = z.object({
  debt_id: z.coerce.number().int().positive(),
  // ISO 8601 datetime, e.g. "2026-09-05T09:00:00.000Z"
  remind_at: z.coerce.date(),
  message: z.string().trim().min(1).max(300),
});

const updateReminderSchema = z
  .object({
    remind_at: z.coerce.date().optional(),
    message: z.string().trim().min(1).max(300).optional(),
    is_sent: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided.',
  });

module.exports = { createReminderSchema, updateReminderSchema };
