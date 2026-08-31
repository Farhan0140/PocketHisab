// ============================================================================
// src/services/categoryService.js
//
// Categories are either "global" (user_id IS NULL — the seeded defaults,
// shared read-only by every account) or owned by a single user (their
// custom categories). Deletion is always a SOFT delete (is_active = false)
// so that old transactions referencing a category never break, even after
// the user removes it from their active list.
// ============================================================================

const knex = require('../db/knex');
const { NotFoundError, ForbiddenError } = require('../utils/ApiError');

/**
 * Lists categories visible to a user: their own custom categories plus every
 * global default. By default only returns active ones (what a NEW
 * transaction should be allowed to pick from); pass activeOnly:false to also
 * include categories the user has soft-deleted (rarely needed directly,
 * since historical transactions join their category regardless of
 * is_active).
 */
async function list(userId, { activeOnly = true } = {}) {
  let query = knex('categories').where((builder) => {
    builder.where('user_id', userId).orWhereNull('user_id');
  });

  if (activeOnly) {
    query = query.andWhere('is_active', true);
  }

  return query.orderBy(['is_default', 'name']);
}

async function create(userId, { name, icon, color }) {
  const [category] = await knex('categories')
    .insert({
      user_id: userId,
      name,
      icon: icon ?? null,
      color: color ?? null,
      is_default: false,
      is_active: true,
    })
    .returning('*');

  return category;
}

/**
 * Fetches a category and asserts it belongs to `userId` (never a global
 * default, and never another user's category) — used before update/delete.
 */
async function getOwnedOrThrow(categoryId, userId) {
  const category = await knex('categories').where({ id: categoryId }).first();

  if (!category) throw new NotFoundError('Category not found');

  if (category.user_id === null) {
    throw new ForbiddenError('Default categories cannot be modified or deleted.');
  }
  if (category.user_id !== userId) {
    // Reported as 404, not 403, so we never confirm to a client that a
    // resource id belonging to someone else even exists.
    throw new NotFoundError('Category not found');
  }

  return category;
}

async function update(categoryId, userId, updates) {
  await getOwnedOrThrow(categoryId, userId);

  const [category] = await knex('categories').where({ id: categoryId }).update(updates).returning('*');

  return category;
}

async function remove(categoryId, userId) {
  await getOwnedOrThrow(categoryId, userId);

  // Soft delete only — see file header. A category with existing
  // transactions must never be hard-deleted.
  await knex('categories').where({ id: categoryId }).update({ is_active: false });
}

module.exports = { list, create, update, remove, getOwnedOrThrow };
