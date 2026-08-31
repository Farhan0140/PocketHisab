// ============================================================================
// src/controllers/auth.controller.js
//
// Thin HTTP-layer glue for GET/PATCH /auth/me. All controllers in this app
// follow the same shape: pull what's needed off `req`, call exactly one
// service function, format the result with sendSuccess(). No business logic
// or database queries belong here — that all lives in userService.
// ============================================================================

const userService = require('../services/userService');
const { sendSuccess } = require('../utils/responseEnvelope');

const getMe = async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  sendSuccess(res, { data: user });
};

const updateMe = async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  sendSuccess(res, { data: user });
};

module.exports = { getMe, updateMe };
