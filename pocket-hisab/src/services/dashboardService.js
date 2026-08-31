// ============================================================================
// src/services/dashboardService.js
//
// Read-only aggregations that power the Home screen: today's/this month's/
// this year's totals, an income-vs-expense breakdown, and a recent-activity
// feed. Nothing here writes to the database.
// ============================================================================

const knex = require('../db/knex');

/**
 * Sums income/expense for a user within [today's period, i.e. the current
 * day/month/year]. Reused three times below for the three periods the
 * dashboard needs at once.
 */
async function totalsForPeriod(userId, unit) {
  const row = await knex('transactions')
    .where({ user_id: userId })
    .andWhereRaw(`date_trunc(?, transaction_date) = date_trunc(?, CURRENT_DATE)`, [unit, unit])
    .select(
      knex.raw(`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income_total`),
      knex.raw(`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense_total`)
    )
    .first();

  return {
    income_total: Number(row.income_total),
    expense_total: Number(row.expense_total),
    net_total: Number(row.income_total) - Number(row.expense_total),
  };
}

/**
 * GET /dashboard/summary — today/this-month/this-year totals in one call.
 */
async function getSummary(userId) {
  const [today, month, year] = await Promise.all([
    totalsForPeriod(userId, 'day'),
    totalsForPeriod(userId, 'month'),
    totalsForPeriod(userId, 'year'),
  ]);

  return { today, this_month: month, this_year: year };
}

/**
 * GET /dashboard/recent-activity — last N transactions, most recent first,
 * joined with their category so the client can render an icon/name without
 * a second round trip.
 */
async function getRecentActivity(userId, limit) {
  return knex('transactions')
    .leftJoin('categories', 'transactions.category_id', 'categories.id')
    .where('transactions.user_id', userId)
    .orderBy('transactions.transaction_date', 'desc')
    .orderBy('transactions.id', 'desc')
    .limit(limit)
    .select(
      'transactions.id',
      'transactions.type',
      'transactions.amount',
      'transactions.note',
      'transactions.transaction_date',
      'transactions.created_at',
      'categories.id as category_id',
      'categories.name as category_name',
      'categories.icon as category_icon',
      'categories.color as category_color'
    );
}

module.exports = { getSummary, getRecentActivity };
