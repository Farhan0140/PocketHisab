// ============================================================================
// Migration: create_reminders_table
//
// Kept separate from `debts` (rather than a single reminder_at column on the
// debt itself) so one debt can have multiple reminders, e.g. "3 days before"
// and "on the due date". These rows are pure data — per the product
// decision recorded in the plan, the backend does NOT run a cron job or send
// push notifications; the mobile app reads this table and schedules its own
// local OS notifications from it. `is_sent` is still tracked so the app can
// mark a reminder as delivered/acknowledged if it chooses to.
// ============================================================================

/** @param {import('knex').Knex} knex */
exports.up = function up(knex) {
  return knex.schema.createTable('reminders', (table) => {
    table.increments('id').primary();

    table
      .integer('debt_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('debts')
      .onDelete('CASCADE');

    table.timestamp('remind_at').notNullable();
    table.string('message').notNullable();
    table.boolean('is_sent').notNullable().defaultTo(false);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['debt_id'], 'reminders_debt_idx');
    // Powers "reminders due soon" style queries.
    table.index(['remind_at'], 'reminders_remind_at_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('reminders');
};
