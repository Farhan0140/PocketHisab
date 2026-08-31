// ============================================================================
// src/routes/auth.routes.js — GET/PATCH /api/v1/auth/me
//
// Note: there are deliberately NO /auth/register, /auth/login, /auth/logout,
// or /auth/reset-password routes here. Those flows are handled entirely by
// Firebase Authentication on the client side (Email/Password + Google) — by
// the time a request reaches this API, the user is already authenticated
// and authMiddleware (mounted in src/routes/index.js) has already verified
// their token and populated req.user.
// ============================================================================

const express = require('express');
const authController = require('../controllers/auth.controller');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { updateProfileSchema } = require('../validators/authValidators');

const router = express.Router();

router.get('/me', asyncHandler(authController.getMe));
router.patch('/me', validate(updateProfileSchema, 'body'), asyncHandler(authController.updateMe));

module.exports = router;
