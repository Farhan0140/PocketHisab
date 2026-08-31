// ============================================================================
// src/controllers/savingsPot.controller.js
// ============================================================================

const savingsPotService = require('../services/savingsPotService');
const { sendSuccess } = require('../utils/responseEnvelope');

const list = async (req, res) => {
  const { pots, totalSaved } = await savingsPotService.list(req.user.id);
  sendSuccess(res, { data: pots, meta: { total_saved: totalSaved } });
};

const getById = async (req, res) => {
  const pot = await savingsPotService.getById(req.params.id, req.user.id);
  sendSuccess(res, { data: pot });
};

const create = async (req, res) => {
  const pot = await savingsPotService.create(req.user.id, req.body);
  sendSuccess(res, { data: pot, status: 201 });
};

const update = async (req, res) => {
  const pot = await savingsPotService.update(req.params.id, req.user.id, req.body);
  sendSuccess(res, { data: pot });
};

const remove = async (req, res) => {
  await savingsPotService.remove(req.params.id, req.user.id);
  sendSuccess(res, { data: null });
};

const addEntry = async (req, res) => {
  const result = await savingsPotService.addEntry(req.params.id, req.user.id, req.body);
  sendSuccess(res, { data: result, status: 201 });
};

const listEntries = async (req, res) => {
  const entries = await savingsPotService.getEntries(req.params.id, req.user.id);
  sendSuccess(res, { data: entries });
};

module.exports = { list, getById, create, update, remove, addEntry, listEntries };
