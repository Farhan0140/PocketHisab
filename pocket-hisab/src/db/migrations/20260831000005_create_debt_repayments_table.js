// ============================================================================
// Migration: create_debt_repayments_table
//
// One row per repayment (full or partial) logged against a debt. Keeping
// these as an append-only history — rather than only updating
// debts.remaining_amount in place — lets the API show a full repayment
// timeline (GET /debts/:id/repayments).
// ============================================================================

/** @param {import('knex').Knex} knex */
exports.up = function up(knex) {
  return knex.schema.createTable('debt_repayments', (table) => {
    table.increments('id').primary();

    table
      .integer('debt_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('debts')
      .onDelete('CASCADE');

    table.decimal('amount', 14, 2).notNullable();
    table.check('?? > 0', ['amount'], 'debt_repayments_amount_positive_check');

    table.date('repaid_date').notNullable().defaultTo(knex.fn.now());
    table.text('note').nullable();

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['debt_id'], 'debt_repayments_debt_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('debt_repayments');
};
