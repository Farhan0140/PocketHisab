// ============================================================================
// src/routes/balance.routes.js — GET /api/v1/balance
// ============================================================================

const express = require('express');
const balanceController = require('../controllers/balance.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(balanceController.getBalance));

module.exports = router;
