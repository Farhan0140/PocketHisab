// ============================================================================
// Migration: create_savings_history_table
//
// Append-only deposit/withdrawal log per savings pot. Powers
// GET /savings-pots/:id/entries and is always written in the same DB
// transaction as the current_amount update on the parent pot, so the two
// can never drift apart.
// ============================================================================

/** @param {import('knex').Knex} knex */
exports.up = function up(knex) {
  return knex.schema.createTable('savings_history', (table) => {
    table.increments('id').primary();

    table
      .integer('savings_pot_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('savings_pots')
      .onDelete('CASCADE');

    table.string('type').notNullable();
    table.check(
      "?? IN ('deposit', 'withdrawal')",
      ['type'],
      'savings_history_type_check'
    );

    table.decimal('amount', 14, 2).notNullable();
    table.check('?? > 0', ['amount'], 'savings_history_amount_positive_check');

    table.text('note').nullable();
    table.date('entry_date').notNullable().defaultTo(knex.fn.now());

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['savings_pot_id'], 'savings_history_pot_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('savings_history');
};
