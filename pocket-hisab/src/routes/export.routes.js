// ============================================================================
// src/routes/export.routes.js — /api/v1/export
// ============================================================================

const express = require('express');
const exportController = require('../controllers/export.controller');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/transactions', asyncHandler(exportController.exportTransactions));
router.get('/full-backup', asyncHandler(exportController.exportFullBackup));

module.exports = router;
