// ============================================================================
// src/routes/reminder.routes.js — /api/v1/reminders
// ============================================================================

const express = require('express');
const reminderController = require('../controllers/reminder.controller');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { createReminderSchema, updateReminderSchema } = require('../validators/reminderValidators');

const router = express.Router();

router.get('/', asyncHandler(reminderController.list));
router.post('/', validate(createReminderSchema, 'body'), asyncHandler(reminderController.create));
router.patch('/:id', validate(updateReminderSchema, 'body'), asyncHandler(reminderController.update));
router.delete('/:id', asyncHandler(reminderController.remove));

module.exports = router;
