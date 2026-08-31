// ============================================================================
// src/routes/index.js
//
// The single entry point for everything under /api/v1. Every request that
// reaches this router first passes through authMiddleware (every endpoint in
// this API requires a verified Firebase ID token — see the design plan), and
// is then handed off to one resource-specific router per feature area.
//
// This file is filled in incrementally as each feature is built; see the
// commented-out require()/use() lines below as features are added.
// ============================================================================

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Every route below this line requires a verified Firebase ID token. Mounted
// once here (rather than per-route) since there is no public/unauthenticated
// endpoint under /api/v1 in this API.
router.use(authMiddleware);

router.use('/auth', require('./auth.routes'));
router.use('/balance', require('./balance.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/transactions', require('./transaction.routes'));
router.use('/categories', require('./category.routes'));
router.use('/debts', require('./debt.routes'));
router.use('/reminders', require('./reminder.routes'));
router.use('/savings-pots', require('./savingsPot.routes'));
router.use('/export', require('./export.routes'));

module.exports = router;
