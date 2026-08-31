// ============================================================================
// src/routes/dashboard.routes.js — /api/v1/dashboard
// ============================================================================

const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/summary', asyncHandler(dashboardController.getSummary));
router.get('/recent-activity', asyncHandler(dashboardController.getRecentActivity));

module.exports = router;
