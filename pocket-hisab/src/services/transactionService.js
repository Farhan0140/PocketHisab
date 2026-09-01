// ============================================================================
// src/services/transactionService.js
//
// CRUD + querying for the core ledger table. Every write (create/update/
// delete) runs inside a Knex transaction that ALSO recomputes and caches the
// user's balance (see balanceService) — so the transaction row and the
// cached balance can never end up out of sync, even if the process crashes
// mid-write (the DB transaction just rolls back entirely).
// ============================================================================

const knex = require('../db/knex');
const balanceService = require('./balanceService');
const { NotFoundError, BadRequestError } = require('../utils/ApiError');

/**
 * Fetches one transaction, scoped to its owner. Never leaks the existence of
 * another user's transaction (404 either way).
 */
async function getOwnedOrThrow(transactionId, userId) {
  const transaction = await knex('transactions').where({ id: transactionId, user_id: userId }).first();
  if (!transaction) throw new NotFoundError('Transaction not found');
  return transaction;
}

/**
 * Confirms a category_id (when provided) actually belongs to this user (or
 * is a global default) before we let a transaction reference it — prevents
 * one user's transaction pointing at another user's private category.
 */
async function assertCategoryUsable(categoryId, userId) {
  if (categoryId == null) return;
  const category = await knex('categories')
    .where({ id: categoryId })
    .andWhere((builder) => builder.where('user_id', userId).orWhereNull('user_id'))
    .first();
  if (!category) throw new BadRequestError('category_id does not reference a valid category.');
}

/**
 * Lists a user's transactions with optional filters + pagination.
 *
 * The category is LEFT JOINed in and its name/icon/color are embedded
 * directly on each row (category_name/category_icon/category_color),
 * exactly like GET /dashboard/recent-activity already does — deliberately
 * NOT filtered by `categories.is_active`. A soft-deleted category (see
 * categoryService.remove — deletion never touches the categories row or any
 * transaction, it only flips is_active) must keep showing its original
 * name/icon/color on every transaction that already referenced it; only
 * "pick a category for a NEW transaction" pickers should ever hide inactive
 * categories, and this list is history, not a picker.
 *
 * @param {string} userId
 * @param {{ type?, category_id?, start_date?, end_date?, search? }} filters
 * @param {{ limit: number, offset: number }} pagination
 * @returns {Promise<{ rows: object[], totalCount: number }>}
 */
async function list(userId, filters, pagination) {
  const applyFilters = (query) => {
    query = query.where('transactions.user_id', userId);
    if (filters.type) query = query.andWhere('transactions.type', filters.type);
    if (filters.category_id) query = query.andWhere('transactions.category_id', filters.category_id);
    if (filters.start_date) query = query.andWhere('transactions.transaction_date', '>=', filters.start_date);
    if (filters.end_date) query = query.andWhere('transactions.transaction_date', '<=', filters.end_date);
    if (filters.search) query = query.andWhere('transactions.note', 'ilike', `%${filters.search}%`);
    return query;
  };

  const baseQuery = () => knex('transactions').leftJoin('categories', 'transactions.category_id', 'categories.id');

  const [rows, [{ count }]] = await Promise.all([
    applyFilters(baseQuery())
      .orderBy('transactions.transaction_date', 'desc')
      .orderBy('transactions.id', 'desc')
      .limit(pagination.limit)
      .offset(pagination.offset)
      .select(
        'transactions.*',
        'categories.name as category_name',
        'categories.icon as category_icon',
        'categories.color as category_color'
      ),
    applyFilters(baseQuery()).count({ count: 'transactions.id' }),
  ]);

  return { rows, totalCount: Number(count) };
}

async function getById(transactionId, userId) {
  return getOwnedOrThrow(transactionId, userId);
}

/**
 * @param {string} userId
 * @param {{ type, amount, category_id, note, transaction_date }} data
 */
async function create(userId, data) {
  await assertCategoryUsable(data.category_id, userId);

  return knex.transaction(async (trx) => {
    const [transaction] = await trx('transactions')
      .insert({
        user_id: userId,
        type: data.type,
        amount: data.amount,
        category_id: data.category_id ?? null,
        note: data.note ?? null,
        transaction_date: data.transaction_date || trx.fn.now(),
      })
      .returning('*');

    await balanceService.recomputeAndCacheBalance(userId, trx);

    return transaction;
  });
}

async function update(transactionId, userId, updates) {
  const existing = await getOwnedOrThrow(transactionId, userId);

  // Merge onto the existing row so the income/expense <-> category_id rule
  // (already validated at the schema layer against the merged shape) is
  // consistent with what actually ends up persisted.
  const merged = { ...existing, ...updates };
  if (merged.type === 'income') merged.category_id = null;

  await assertCategoryUsable(merged.category_id, userId);

  return knex.transaction(async (trx) => {
    const [transaction] = await trx('transactions')
      .where({ id: transactionId })
      .update({
        type: merged.type,
        amount: merged.amount,
        category_id: merged.category_id,
        note: merged.note,
        transaction_date: merged.transaction_date,
        updated_at: trx.fn.now(),
      })
      .returning('*');

    await balanceService.recomputeAndCacheBalance(userId, trx);

    return transaction;
  });
}

async function remove(transactionId, userId) {
  await getOwnedOrThrow(transactionId, userId);

  await knex.transaction(async (trx) => {
    await trx('transactions').where({ id: transactionId }).del();
    await balanceService.recomputeAndCacheBalance(userId, trx);
  });
}

/**
 * Aggregated totals for GET /transactions/summary?period=day|month|year&date=
 * Buckets by the calendar period containing `date` (defaults to today).
 */
async function summaryByPeriod(userId, period, date) {
  const truncUnit = period; // 'day' | 'month' | 'year' map directly to Postgres date_trunc units.
  const reference = date || new Date().toISOString().slice(0, 10);

  const row = await knex('transactions')
    .where({ user_id: userId })
    .andWhereRaw(`date_trunc(?, transaction_date) = date_trunc(?, ?::date)`, [
      truncUnit,
      truncUnit,
      reference,
    ])
    .select(
      knex.raw(`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income_total`),
      knex.raw(`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense_total`),
      knex.raw(`COUNT(*)::int AS transaction_count`)
    )
    .first();

  return {
    period,
    reference_date: reference,
    income_total: Number(row.income_total),
    expense_total: Number(row.expense_total),
    net_total: Number(row.income_total) - Number(row.expense_total),
    transaction_count: row.transaction_count,
  };
}

/**
 * Aggregated EXPENSE totals grouped by category — powers the History pie
 * chart. Income has no category, so this only ever considers expenses.
 */
async function summaryByCategory(userId, { start_date, end_date } = {}) {
  let query = knex('transactions')
    .leftJoin('categories', 'transactions.category_id', 'categories.id')
    .where('transactions.user_id', userId)
    .andWhere('transactions.type', 'expense');

  if (start_date) query = query.andWhere('transaction_date', '>=', start_date);
  if (end_date) query = query.andWhere('transaction_date', '<=', end_date);

  const rows = await query
    .groupBy('categories.id', 'categories.name', 'categories.icon', 'categories.color')
    .select(
      'categories.id as category_id',
      'categories.name as category_name',
      'categories.icon as category_icon',
      'categories.color as category_color',
      knex.raw('SUM(transactions.amount)::numeric AS total_amount'),
      knex.raw('COUNT(*)::int AS transaction_count')
    )
    .orderBy('total_amount', 'desc');

  return rows.map((row) => ({ ...row, total_amount: Number(row.total_amount) }));
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  summaryByPeriod,
  summaryByCategory,
};
