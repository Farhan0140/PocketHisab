// ============================================================================
// Seed: 01_default_categories
//
// Inserts the global (user_id = NULL) categories that every account sees by
// default, alongside whatever custom categories a user creates for
// themselves. Re-running `npx knex seed:run` is safe: we delete existing
// default categories first, so this seed is idempotent.
// ============================================================================

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#F97316' },
  { name: 'Transport', icon: '🚌', color: '#3B82F6' },
  { name: 'Bills', icon: '🧾', color: '#EF4444' },
  { name: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { name: 'Health', icon: '💊', color: '#10B981' },
  { name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
  { name: 'Education', icon: '📚', color: '#0EA5E9' },
  { name: 'Others', icon: '📦', color: '#6B7280' },
];

/** @param {import('knex').Knex} knex */
exports.seed = async function seed(knex) {
  // Only remove the GLOBAL default categories (user_id IS NULL). Never touch
  // rows belonging to a specific user, even if they happen to share a name.
  await knex('categories').where({ user_id: null, is_default: true }).del();

  await knex('categories').insert(
    DEFAULT_CATEGORIES.map((category) => ({
      ...category,
      user_id: null,
      is_default: true,
      is_active: true,
    }))
  );
};
