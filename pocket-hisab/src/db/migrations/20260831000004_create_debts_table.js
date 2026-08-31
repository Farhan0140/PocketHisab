// ============================================================================
// Migration: create_debts_table
//
// Money the user owes to someone else. `remaining_amount` starts equal to
// `amount` and is decremented every time a repayment is logged (see
// debt_repayments below and src/services/debtService.js).
//
// `status` is the LAST WRITTEN status (updated eagerly whenever a repayment
// changes remaining_amount to 0 -> 'paid', or > 0 -> 'partially_paid'). It is
// deliberately NOT trusted for the 'overdue' transition, because "is
// due_date in the past" can become true without any write ever happening to
// this row. Reads always go through debtService.getEffectiveStatus(), which
// recomputes 'overdue' live instead of relying on a background cron job.
// ============================================================================

/** @param {import('knex').Knex} knex */
exports.up = function up(knex) {
  return knex.schema.createTable('debts', (table) => {
    table.increments('id').primary();

    table
      .text('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('person_name').notNullable();

    table.decimal('amount', 14, 2).notNullable();
    table.check('?? > 0', ['amount'], 'debts_amount_positive_check');

    table.decimal('remaining_amount', 14, 2).notNullable();
    table.check('?? >= 0', ['remaining_amount'], 'debts_remaining_nonnegative_check');

    table.text('note').nullable();
    table.date('due_date').nullable();

    table.string('status').notNullable().defaultTo('pending');
    table.check(
      "?? IN ('pending', 'partially_paid', 'paid', 'overdue')",
      ['status'],
      'debts_status_check'
    );

    table.timestamps(true, true);

    // Powers "list my debts filtered by status" (GET /debts?status=...).
    table.index(['user_id', 'status'], 'debts_user_status_idx');
    // Powers GET /debts/upcoming (due_date range scan) and overdue derivation.
    table.index(['user_id', 'due_date'], 'debts_user_due_date_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('debts');
};
