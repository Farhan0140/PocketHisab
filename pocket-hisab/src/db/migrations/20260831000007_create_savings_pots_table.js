// ============================================================================
// Migration: create_savings_pots_table
//
// A savings pot is a manually tracked stash of money (e.g. "Emergency Fund",
// "Cash at Home"). Per the documented product decision, pots are fully
// INDEPENDENT of Total Balance: depositing into or withdrawing from a pot
// never inserts a row into `transactions` and never changes a user's
// balance. `current_amount` is the authoritative running total for a pot,
// kept in sync with `savings_history` inside a DB transaction (see
// src/services/savingsPotService.js).
// ============================================================================

/** @param {import('knex').Knex} knex */
exports.up = function up(knex) {
  return knex.schema.createTable('savings_pots', (table) => {
    table.increments('id').primary();

    table
      .text('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('title').notNullable();
    table.string('icon').nullable();

    table.decimal('current_amount', 14, 2).notNullable().defaultTo(0);
    table.check(
      '?? >= 0',
      ['current_amount'],
      'savings_pots_current_amount_nonnegative_check'
    );

    table.timestamps(true, true);

    table.index(['user_id'], 'savings_pots_user_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('savings_pots');
};
