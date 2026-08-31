// ============================================================================
// src/controllers/balance.controller.js — GET /api/v1/balance
// ============================================================================

const balanceService = require('../services/balanceService');
const { sendSuccess } = require('../utils/responseEnvelope');

const getBalance = async (req, res) => {
  const balance = await balanceService.getBalance(req.user.id);
  sendSuccess(res, { data: { balance } });
};

module.exports = { getBalance };
