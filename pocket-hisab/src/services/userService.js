// ============================================================================
// src/services/userService.js
//
// Everything to do with the `users` table. The most important function here
// is findOrCreateFromFirebaseToken(), called by authMiddleware on every
// authenticated request — it's what auto-provisions a local `users` row the
// very first time a given Firebase account is seen by this API.
// ============================================================================

const knex = require('../db/knex');
const { NotFoundError } = require('../utils/ApiError');

/**
 * Upserts a `users` row for the given decoded Firebase token. Uses a single
 * atomic `INSERT ... ON CONFLICT` rather than "SELECT then INSERT if
 * missing", which would otherwise have a race condition if the same
 * brand-new user fired two requests at once.
 *
 * @param {{ uid: string, email: string }} firebaseUser
 * @returns {Promise<object>} The user row (existing or newly created).
 */
async function findOrCreateFromFirebaseToken({ uid, email }) {
  const [user] = await knex('users')
    .insert({ id: uid, email })
    // If this Firebase UID already has a row, just keep it in sync with
    // whatever email Firebase currently has on file for them (e.g. after
    // they change their email with their identity provider).
    .onConflict('id')
    .merge({ email })
    .returning('*');

  return user;
}

/**
 * @param {string} userId
 * @returns {Promise<object>} The user's profile row.
 */
async function getProfile(userId) {
  const user = await knex('users').where({ id: userId }).first();
  if (!user) throw new NotFoundError('User not found');
  return user;
}

/**
 * Updates editable profile fields (name, currency). Deliberately does NOT
 * accept `email` (owned by Firebase) or `cached_balance` (only ever written
 * by balanceService) here — those are not "profile" fields a client should
 * be able to set directly.
 *
 * @param {string} userId
 * @param {{ name?: string, currency?: string }} updates
 */
async function updateProfile(userId, updates) {
  const [user] = await knex('users')
    .where({ id: userId })
    .update({ ...updates, updated_at: knex.fn.now() })
    .returning('*');

  if (!user) throw new NotFoundError('User not found');
  return user;
}

module.exports = { findOrCreateFromFirebaseToken, getProfile, updateProfile };
