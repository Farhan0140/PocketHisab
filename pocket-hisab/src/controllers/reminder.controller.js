// ============================================================================
// src/controllers/reminder.controller.js
// ============================================================================

const reminderService = require('../services/reminderService');
const { sendSuccess } = require('../utils/responseEnvelope');

const list = async (req, res) => {
  const reminders = await reminderService.list(req.user.id);
  sendSuccess(res, { data: reminders });
};

const create = async (req, res) => {
  const reminder = await reminderService.create(req.user.id, req.body);
  sendSuccess(res, { data: reminder, status: 201 });
};

const update = async (req, res) => {
  const reminder = await reminderService.update(req.params.id, req.user.id, req.body);
  sendSuccess(res, { data: reminder });
};

const remove = async (req, res) => {
  await reminderService.remove(req.params.id, req.user.id);
  sendSuccess(res, { data: null });
};

module.exports = { list, create, update, remove };
