// ============================================================================
// src/routes/transaction.routes.js — /api/v1/transactions
//
// Route order matters here: the two /summary* routes must be declared
// BEFORE the /:id route, otherwise Express would match "summary" itself as
// an :id parameter.
// ============================================================================

const express = require('express');
const transactionController = require('../controllers/transaction.controller');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const pagination = require('../middleware/pagination');
const {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
  summaryQuerySchema,
} = require('../validators/transactionValidators');

const router = express.Router();

router.get(
  '/summary',
  validate(summaryQuerySchema, 'query'),
  asyncHandler(transactionController.summary)
);
router.get('/summary/by-category', asyncHandler(transactionController.summaryByCategory));

router.get(
  '/',
  validate(listTransactionsQuerySchema, 'query'),
  pagination,
  asyncHandler(transactionController.list)
);
router.get('/:id', asyncHandler(transactionController.getById));
router.post('/', validate(createTransactionSchema, 'body'), asyncHandler(transactionController.create));
router.patch(
  '/:id',
  validate(updateTransactionSchema, 'body'),
  asyncHandler(transactionController.update)
);
router.delete('/:id', asyncHandler(transactionController.remove));

module.exports = router;
