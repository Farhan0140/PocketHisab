// ============================================================================
// src/validators/authValidators.js
//
// Zod schemas for the /auth/me endpoints. GET /auth/me has no body to
// validate; only PATCH needs a schema.
// ============================================================================

const { z } = require('zod');

// Every field is optional (a PATCH can update just one field), but at least
// one of them must be present, and email/password/id are intentionally NOT
// accepted here — email is owned by Firebase, there is no password, and the
// id can never change.
const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    currency: z
      .string()
      .trim()
      .length(3)
      .toUpperCase()
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (name, currency) must be provided.',
  });

module.exports = { updateProfileSchema };
