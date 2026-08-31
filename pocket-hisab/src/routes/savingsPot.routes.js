// ============================================================================
// src/routes/savingsPot.routes.js — /api/v1/savings-pots
// ============================================================================

const express = require('express');
const savingsPotController = require('../controllers/savingsPot.controller');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const {
  createPotSchema,
  updatePotSchema,
  createEntrySchema,
} = require('../validators/savingsPotValidators');

const router = express.Router();

router.get('/', asyncHandler(savingsPotController.list));
router.get('/:id', asyncHandler(savingsPotController.getById));
router.post('/', validate(createPotSchema, 'body'), asyncHandler(savingsPotController.create));
router.patch('/:id', validate(updatePotSchema, 'body'), asyncHandler(savingsPotController.update));
router.delete('/:id', asyncHandler(savingsPotController.remove));

router.get('/:id/entries', asyncHandler(savingsPotController.listEntries));
router.post(
  '/:id/entries',
  validate(createEntrySchema, 'body'),
  asyncHandler(savingsPotController.addEntry)
);

module.exports = router;
