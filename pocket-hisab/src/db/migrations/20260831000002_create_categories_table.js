// ============================================================================
// Migration: create_categories_table
//
// A category can either belong to one user (a custom category they created)
// or be "global" (user_id IS NULL): the set of default categories every
// account starts with, seeded in src/db/seeds/01_default_categories.js.
//
// `is_active` implements soft-delete: a user can deactivate a custom
// category so it stops showing up as a choice for NEW transactions, without
// breaking the category_id foreign key on any OLD transaction that already
// references it.
// ============================================================================

/** @param {import('knex').Knex} knex */
exports.up = function up(knex) {
  return knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();

    // NULL = a global/default category shared by every user.
    table
      .text('user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('name').notNullable();
    table.string('icon').nullable(); // emoji or icon identifier
    table.string('color').nullable(); // hex color, e.g. "#FF5733"

    table.boolean('is_default').notNullable().defaultTo(false);
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Speeds up the very common "categories available to this user" query:
    // WHERE (user_id = ? OR user_id IS NULL) AND is_active = true
    table.index(['user_id', 'is_active'], 'categories_user_active_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('categories');
};
