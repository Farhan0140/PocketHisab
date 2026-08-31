// ============================================================================
// src/controllers/debt.controller.js
// ============================================================================

const debtService = require('../services/debtService');
const { sendSuccess, buildPaginationMeta } = require('../utils/responseEnvelope');

const list = async (req, res) => {
  const { rows, totalCount } = await debtService.list(req.user.id, req.query, req.pagination);
  sendSuccess(res, { data: rows, meta: buildPaginationMeta(req.pagination, totalCount) });
};

const getById = async (req, res) => {
  const debt = await debtService.getById(req.params.id, req.user.id);
  sendSuccess(res, { data: debt });
};

const create = async (req, res) => {
  const debt = await debtService.create(req.user.id, req.body);
  sendSuccess(res, { data: debt, status: 201 });
};

const update = async (req, res) => {
  const debt = await debtService.update(req.params.id, req.user.id, req.body);
  sendSuccess(res, { data: debt });
};

const remove = async (req, res) => {
  await debtService.remove(req.params.id, req.user.id);
  sendSuccess(res, { data: null });
};

const addRepayment = async (req, res) => {
  const result = await debtService.applyRepayment(req.params.id, req.user.id, req.body);
  sendSuccess(res, { data: result, status: 201 });
};

const listRepayments = async (req, res) => {
  const repayments = await debtService.getRepayments(req.params.id, req.user.id);
  sendSuccess(res, { data: repayments });
};

const getUpcoming = async (req, res) => {
  const debts = await debtService.getUpcoming(req.user.id, req.query.days);
  sendSuccess(res, { data: debts });
};

module.exports = { list, getById, create, update, remove, addRepayment, listRepayments, getUpcoming };
