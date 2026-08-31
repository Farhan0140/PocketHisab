// ============================================================================
// src/services/reminderService.js
//
// Pure CRUD over the `reminders` table. Per the documented product
// decision, this backend does NOT send push notifications itself — it only
// stores reminder data (when + what message) for the mobile app to schedule
// as a local OS notification. Every operation first confirms the parent
// debt belongs to the requesting user, since `reminders` has no user_id of
// its own — ownership is always established through the debt it belongs to.
// ============================================================================

const knex = require('../db/knex');
const debtService = require('./debtService');
const { NotFoundError } = require('../utils/ApiError');

async function list(userId) {
  return knex('reminders')
    .join('debts', 'reminders.debt_id', 'debts.id')
    .where('debts.user_id', userId)
    .orderBy('reminders.remind_at', 'asc')
    .select('reminders.*');
}

async function create(userId, { debt_id, remind_at, message }) {
  // Throws NotFoundError if the debt doesn't exist or isn't owned by this user.
  await debtService.getOwnedOrThrow(debt_id, userId);

  const [reminder] = await knex('reminders')
    .insert({ debt_id, remind_at, message, is_sent: false })
    .returning('*');

  return reminder;
}

async function getOwnedOrThrow(reminderId, userId) {
  const reminder = await knex('reminders')
    .join('debts', 'reminders.debt_id', 'debts.id')
    .where('reminders.id', reminderId)
    .andWhere('debts.user_id', userId)
    .select('reminders.*')
    .first();

  if (!reminder) throw new NotFoundError('Reminder not found');
  return reminder;
}

async function update(reminderId, userId, updates) {
  await getOwnedOrThrow(reminderId, userId);

  const [reminder] = await knex('reminders').where({ id: reminderId }).update(updates).returning('*');

  return reminder;
}

async function remove(reminderId, userId) {
  await getOwnedOrThrow(reminderId, userId);
  await knex('reminders').where({ id: reminderId }).del();
}

module.exports = { list, create, update, remove, getOwnedOrThrow };
