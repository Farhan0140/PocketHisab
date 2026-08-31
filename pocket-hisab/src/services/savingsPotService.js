// ============================================================================
// src/services/savingsPotService.js
//
// Savings pots are a fully independent, manually tracked ledger — per the
// documented product decision, deposits/withdrawals here NEVER touch the
// `transactions` table or Total Balance. `current_amount` is kept in sync
// with `savings_history` atomically (same DB transaction), mirroring the
// pattern used for debt repayments in debtService.
// ============================================================================

const knex = require('../db/knex');
const { NotFoundError, BadRequestError } = require('../utils/ApiError');

async function getOwnedOrThrow(potId, userId, trx = knex) {
  const pot = await trx('savings_pots').where({ id: potId, user_id: userId }).first();
  if (!pot) throw new NotFoundError('Savings pot not found');
  return pot;
}

/**
 * Lists a user's pots plus a `total_saved` figure summed across all of them
 * — used by GET /savings-pots to show a headline "total savings" number
 * alongside the individual pots.
 */
async function list(userId) {
  const pots = await knex('savings_pots').where({ user_id: userId }).orderBy('created_at', 'asc');
  const totalSaved = pots.reduce((sum, pot) => sum + Number(pot.current_amount), 0);
  return { pots, totalSaved };
}

async function getById(potId, userId) {
  const pot = await getOwnedOrThrow(potId, userId);
  const history = await knex('savings_history')
    .where({ savings_pot_id: potId })
    .orderBy('entry_date', 'desc')
    .orderBy('id', 'desc');

  return { ...pot, history };
}

async function create(userId, { title, icon }) {
  const [pot] = await knex('savings_pots')
    .insert({ user_id: userId, title, icon: icon ?? null, current_amount: 0 })
    .returning('*');

  return pot;
}

async function update(potId, userId, updates) {
  await getOwnedOrThrow(potId, userId);

  const [pot] = await knex('savings_pots')
    .where({ id: potId })
    .update({ ...updates, updated_at: knex.fn.now() })
    .returning('*');

  return pot;
}

async function remove(potId, userId) {
  await getOwnedOrThrow(potId, userId);
  await knex('savings_pots').where({ id: potId }).del();
}

/**
 * Adds a deposit/withdrawal entry, atomically updating current_amount.
 * Withdrawals larger than the current balance are rejected — a pot can
 * never go negative, mirroring the overpayment guard on debt repayments.
 */
async function addEntry(potId, userId, { type, amount, note, entry_date }) {
  return knex.transaction(async (trx) => {
    const pot = await trx('savings_pots').where({ id: potId, user_id: userId }).forUpdate().first();
    if (!pot) throw new NotFoundError('Savings pot not found');

    if (type === 'withdrawal' && amount > Number(pot.current_amount)) {
      throw new BadRequestError(
        `Withdrawal amount (${amount}) cannot exceed the pot's current balance (${pot.current_amount}).`
      );
    }

    const [entry] = await trx('savings_history')
      .insert({
        savings_pot_id: potId,
        type,
        amount,
        note: note ?? null,
        entry_date: entry_date || trx.fn.now(),
      })
      .returning('*');

    const newAmount =
      type === 'deposit' ? Number(pot.current_amount) + amount : Number(pot.current_amount) - amount;

    const [updatedPot] = await trx('savings_pots')
      .where({ id: potId })
      .update({ current_amount: newAmount, updated_at: trx.fn.now() })
      .returning('*');

    return { pot: updatedPot, entry };
  });
}

async function getEntries(potId, userId) {
  await getOwnedOrThrow(potId, userId);
  return knex('savings_history')
    .where({ savings_pot_id: potId })
    .orderBy('entry_date', 'desc')
    .orderBy('id', 'desc');
}

module.exports = { list, getById, create, update, remove, addEntry, getEntries, getOwnedOrThrow };
