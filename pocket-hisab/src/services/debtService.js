// ============================================================================
// src/services/debtService.js
//
// Debts (money the user owes someone) plus their repayment history. The
// most important concept here is the difference between the PERSISTED
// `status` column and the EFFECTIVE status returned by the API:
//
//   - 'paid' and 'partially_paid' are deterministic outcomes of a repayment
//     being logged, so they are written to the `status` column immediately,
//     inside the same transaction as the repayment (see applyRepayment).
//   - 'overdue' depends on comparing `due_date` to "today", which can
//     become true purely because time passed — with no write happening.
//     Since this project deliberately has NO cron job, we NEVER trust a
//     stale 'overdue' write; instead getEffectiveStatus() recomputes it on
//     every read (list/getById), so it's always correct without a
//     background job.
// ============================================================================

const knex = require('../db/knex');
const { NotFoundError, BadRequestError } = require('../utils/ApiError');

/**
 * Pure function: derives the effective status of a debt row from its
 * current data, ignoring whatever is in `debt.status` for the 'overdue'
 * case. Order of checks matters: fully repaid always wins, even if overdue.
 */
function getEffectiveStatus(debt) {
  if (Number(debt.remaining_amount) <= 0) return 'paid';

  if (debt.due_date) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dueStr = new Date(debt.due_date).toISOString().slice(0, 10);
    if (dueStr < todayStr) return 'overdue';
  }

  if (Number(debt.remaining_amount) < Number(debt.amount)) return 'partially_paid';

  return 'pending';
}

function withEffectiveStatus(debt) {
  return { ...debt, status: getEffectiveStatus(debt) };
}

/**
 * Lists a user's debts, optionally filtered by EFFECTIVE status. Filtering
 * happens in application code (not SQL) because 'overdue' can't be
 * expressed as a plain column comparison without recomputing it — debt
 * volumes for a personal-finance app are small enough that this is not a
 * performance concern.
 */
async function list(userId, { status }, pagination) {
  const rows = await knex('debts').where({ user_id: userId }).orderBy('due_date', 'asc');

  let withStatus = rows.map(withEffectiveStatus);
  if (status) {
    withStatus = withStatus.filter((debt) => debt.status === status);
  }

  const totalCount = withStatus.length;
  const page = withStatus.slice(pagination.offset, pagination.offset + pagination.limit);

  return { rows: page, totalCount };
}

async function getOwnedOrThrow(debtId, userId, trx = knex) {
  const debt = await trx('debts').where({ id: debtId, user_id: userId }).first();
  if (!debt) throw new NotFoundError('Debt not found');
  return debt;
}

async function getById(debtId, userId) {
  const debt = await getOwnedOrThrow(debtId, userId);
  const repayments = await knex('debt_repayments')
    .where({ debt_id: debtId })
    .orderBy('repaid_date', 'desc')
    .orderBy('id', 'desc');

  return { ...withEffectiveStatus(debt), repayments };
}

async function create(userId, data) {
  const [debt] = await knex('debts')
    .insert({
      user_id: userId,
      person_name: data.person_name,
      amount: data.amount,
      remaining_amount: data.amount, // nothing repaid yet
      note: data.note ?? null,
      due_date: data.due_date ?? null,
      status: 'pending',
    })
    .returning('*');

  return withEffectiveStatus(debt);
}

async function update(debtId, userId, updates) {
  await getOwnedOrThrow(debtId, userId);

  const [debt] = await knex('debts')
    .where({ id: debtId })
    .update({ ...updates, updated_at: knex.fn.now() })
    .returning('*');

  return withEffectiveStatus(debt);
}

async function remove(debtId, userId) {
  await getOwnedOrThrow(debtId, userId);
  await knex('debts').where({ id: debtId }).del();
}

/**
 * Logs a repayment against a debt and atomically updates remaining_amount +
 * status. Runs inside a DB transaction with a row lock (`forUpdate`) on the
 * debt so two concurrent repayment requests can never both read the same
 * remaining_amount and double-spend it.
 */
async function applyRepayment(debtId, userId, { amount, repaid_date, note }) {
  return knex.transaction(async (trx) => {
    const debt = await trx('debts').where({ id: debtId, user_id: userId }).forUpdate().first();
    if (!debt) throw new NotFoundError('Debt not found');

    if (amount > Number(debt.remaining_amount)) {
      throw new BadRequestError(
        `Repayment amount (${amount}) cannot exceed the remaining balance (${debt.remaining_amount}).`
      );
    }

    const [repayment] = await trx('debt_repayments')
      .insert({
        debt_id: debtId,
        amount,
        repaid_date: repaid_date || trx.fn.now(),
        note: note ?? null,
      })
      .returning('*');

    const newRemaining = Number(debt.remaining_amount) - amount;
    const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';

    const [updatedDebt] = await trx('debts')
      .where({ id: debtId })
      .update({ remaining_amount: newRemaining, status: newStatus, updated_at: trx.fn.now() })
      .returning('*');

    return { debt: withEffectiveStatus(updatedDebt), repayment };
  });
}

async function getRepayments(debtId, userId) {
  await getOwnedOrThrow(debtId, userId);
  return knex('debt_repayments').where({ debt_id: debtId }).orderBy('repaid_date', 'desc').orderBy('id', 'desc');
}

/**
 * GET /debts/upcoming — debts due within the next `days` days that are not
 * already fully paid. Powers the "upcoming reminders" widget.
 */
async function getUpcoming(userId, days) {
  const rows = await knex('debts')
    .where({ user_id: userId })
    .andWhere('remaining_amount', '>', 0)
    .whereNotNull('due_date')
    .andWhereRaw(`due_date <= CURRENT_DATE + (?::int * interval '1 day')`, [days])
    .orderBy('due_date', 'asc');

  return rows.map(withEffectiveStatus);
}

module.exports = {
  getEffectiveStatus,
  list,
  getById,
  create,
  update,
  remove,
  applyRepayment,
  getRepayments,
  getUpcoming,
  getOwnedOrThrow,
};
