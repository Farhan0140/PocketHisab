// ============================================================================
// src/services/balanceService.js
//
// THE single source of truth for Total Balance math. No other file in this
// app should write its own "sum income minus expense" query — always go
// through computeBalance() here, so the calculation only ever needs to be
// correct in one place.
//
// Total Balance = SUM(income transactions) - SUM(expense transactions).
// It is NEVER stored as a field that other code updates directly; it is
// always derived from the `transactions` table.
// ============================================================================

const knex = require('../db/knex');

/**
 * Computes the live Total Balance for a user directly from the transactions
 * table, using a single SQL aggregate (so the whole ledger never has to be
 * pulled into Node just to sum it).
 *
 * @param {string} userId
 * @param {import('knex').Knex.Transaction} [trx] - Optional Knex transaction to run inside.
 * @returns {Promise<number>}
 */
async function computeBalance(userId, trx = knex) {
  const row = await trx('transactions')
    .where({ user_id: userId })
    .select(
      trx.raw(
        `COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance`
      )
    )
    .first();

  return Number(row.balance);
}

/**
 * Recomputes the balance and writes it into users.cached_balance. Called
 * after every transaction create/update/delete so the cached column never
 * drifts far from reality. Accepts an optional `trx` so callers can run this
 * inside the SAME database transaction as the write that triggered it —
 * that way the transaction row and the cached balance always change
 * atomically together, never leaving an inconsistent state visible to a
 * concurrent read.
 *
 * @param {string} userId
 * @param {import('knex').Knex.Transaction} [trx]
 * @returns {Promise<number>} The freshly computed balance.
 */
async function recomputeAndCacheBalance(userId, trx = knex) {
  const balance = await computeBalance(userId, trx);
  await trx('users').where({ id: userId }).update({ cached_balance: balance });
  return balance;
}

/**
 * Used by GET /balance. Recomputes live (rather than trusting
 * cached_balance) so the reported figure is always correct even if the
 * cache were ever to drift — see the design notes above.
 */
async function getBalance(userId) {
  return computeBalance(userId);
}

module.exports = { computeBalance, recomputeAndCacheBalance, getBalance };
