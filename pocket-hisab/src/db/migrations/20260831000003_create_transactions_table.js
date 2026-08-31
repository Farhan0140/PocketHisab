// ============================================================================
// Migration: create_transactions_table
//
// This is the core ledger. Every "Add Money" (income) and "Spend Money"
// (expense) action in the app inserts exactly one row here. Total Balance is
// NEVER stored directly on this table — it is always derived by summing
// these rows (see src/services/balanceService.js).
//
// `amount` is always stored POSITIVE; the `type` column determines whether
// it adds to or subtracts from the balance. `category_id` is nullable
// because income transactions have no category — the app layer enforces
// "category required for expense, forbidden for income" (see
// src/validators/transactionValidators.js), while the database only
// enforces that IF a category is set, it must exist.
// ============================================================================

/** @param {import('knex').Knex} knex */
exports.up = function up(knex) {
  return knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();

    table
      .text('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.string('type').notNullable();
    table
      .check("?? IN ('income', 'expense')", ['type'], 'transactions_type_check');

    table.decimal('amount', 14, 2).notNullable();
    table.check('?? > 0', ['amount'], 'transactions_amount_positive_check');

    // If the category a transaction pointed to is ever deleted (should be
    // rare, since categories are normally soft-deleted), fall back to NULL
    // rather than deleting the transaction itself.
    table
      .integer('category_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');

    table.text('note').nullable();

    // User-editable date the transaction is "for" (defaults to today from
    // the application layer). Separate from created_at, which is the
    // immutable audit-trail timestamp of when the row was actually inserted.
    table.date('transaction_date').notNullable();

    table.timestamps(true, true);

    // Powers date-range history queries and the day/month/year summary
    // endpoints, which always filter by user_id + a transaction_date range.
    table.index(['user_id', 'transaction_date'], 'transactions_user_date_idx');
    // Powers "list only income" / "list only expense" filtering.
    table.index(['user_id', 'type'], 'transactions_user_type_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('transactions');
};
