// ============================================================================
// src/validators/categoryValidators.js
// ============================================================================

const { z } = require('zod');

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  icon: z.string().trim().max(20).optional().nullable(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'color must be a hex code like #FF5733')
    .optional()
    .nullable(),
});

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    icon: z.string().trim().max(20).optional().nullable(),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'color must be a hex code like #FF5733')
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (name, icon, color) must be provided.',
  });

module.exports = { createCategorySchema, updateCategorySchema };
