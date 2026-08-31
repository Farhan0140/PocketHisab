// ============================================================================
// src/routes/debt.routes.js — /api/v1/debts
//
// /upcoming is declared before /:id for the same reason as in
// transaction.routes.js — otherwise Express would try to match "upcoming"
// as a debt id.
// ============================================================================

const express = require('express');
const debtController = require('../controllers/debt.controller');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const pagination = require('../middleware/pagination');
const {
  createDebtSchema,
  updateDebtSchema,
  createRepaymentSchema,
  listDebtsQuerySchema,
  upcomingQuerySchema,
} = require('../validators/debtValidators');

const router = express.Router();

router.get(
  '/upcoming',
  validate(upcomingQuerySchema, 'query'),
  asyncHandler(debtController.getUpcoming)
);

router.get('/', validate(listDebtsQuerySchema, 'query'), pagination, asyncHandler(debtController.list));
router.get('/:id', asyncHandler(debtController.getById));
router.post('/', validate(createDebtSchema, 'body'), asyncHandler(debtController.create));
router.patch('/:id', validate(updateDebtSchema, 'body'), asyncHandler(debtController.update));
router.delete('/:id', asyncHandler(debtController.remove));

router.get('/:id/repayments', asyncHandler(debtController.listRepayments));
router.post(
  '/:id/repayments',
  validate(createRepaymentSchema, 'body'),
  asyncHandler(debtController.addRepayment)
);

module.exports = router;
