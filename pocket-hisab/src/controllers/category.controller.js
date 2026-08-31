// ============================================================================
// src/controllers/category.controller.js
// ============================================================================

const categoryService = require('../services/categoryService');
const { sendSuccess } = require('../utils/responseEnvelope');

const list = async (req, res) => {
  const categories = await categoryService.list(req.user.id);
  sendSuccess(res, { data: categories });
};

const create = async (req, res) => {
  const category = await categoryService.create(req.user.id, req.body);
  sendSuccess(res, { data: category, status: 201 });
};

const update = async (req, res) => {
  const category = await categoryService.update(req.params.id, req.user.id, req.body);
  sendSuccess(res, { data: category });
};

const remove = async (req, res) => {
  await categoryService.remove(req.params.id, req.user.id);
  sendSuccess(res, { data: null, status: 200 });
};

module.exports = { list, create, update, remove };
