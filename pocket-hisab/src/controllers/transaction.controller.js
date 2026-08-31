// ============================================================================
// src/controllers/transaction.controller.js
// ============================================================================

const transactionService = require('../services/transactionService');
const { sendSuccess, buildPaginationMeta } = require('../utils/responseEnvelope');

const list = async (req, res) => {
  const { rows, totalCount } = await transactionService.list(req.user.id, req.query, req.pagination);
  sendSuccess(res, { data: rows, meta: buildPaginationMeta(req.pagination, totalCount) });
};

const getById = async (req, res) => {
  const transaction = await transactionService.getById(req.params.id, req.user.id);
  sendSuccess(res, { data: transaction });
};

const create = async (req, res) => {
  const transaction = await transactionService.create(req.user.id, req.body);
  sendSuccess(res, { data: transaction, status: 201 });
};

const update = async (req, res) => {
  const transaction = await transactionService.update(req.params.id, req.user.id, req.body);
  sendSuccess(res, { data: transaction });
};

const remove = async (req, res) => {
  await transactionService.remove(req.params.id, req.user.id);
  sendSuccess(res, { data: null });
};

const summary = async (req, res) => {
  const result = await transactionService.summaryByPeriod(req.user.id, req.query.period, req.query.date);
  sendSuccess(res, { data: result });
};

const summaryByCategory = async (req, res) => {
  const result = await transactionService.summaryByCategory(req.user.id, req.query);
  sendSuccess(res, { data: result });
};

module.exports = { list, getById, create, update, remove, summary, summaryByCategory };
