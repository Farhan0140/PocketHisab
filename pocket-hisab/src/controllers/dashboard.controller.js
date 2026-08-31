// ============================================================================
// src/controllers/dashboard.controller.js
// ============================================================================

const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/responseEnvelope');

const DEFAULT_RECENT_ACTIVITY_LIMIT = 10;
const MAX_RECENT_ACTIVITY_LIMIT = 50;

const getSummary = async (req, res) => {
  const summary = await dashboardService.getSummary(req.user.id);
  sendSuccess(res, { data: summary });
};

const getRecentActivity = async (req, res) => {
  const requestedLimit = Number(req.query.limit);
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_RECENT_ACTIVITY_LIMIT)
      : DEFAULT_RECENT_ACTIVITY_LIMIT;

  const activity = await dashboardService.getRecentActivity(req.user.id, limit);
  sendSuccess(res, { data: activity });
};

module.exports = { getSummary, getRecentActivity };
