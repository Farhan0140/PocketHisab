// ============================================================================
// Migration: create_users_table
//
// `users` is intentionally keyed by TEXT rather than an auto-increment
// integer or a generated UUID: the primary key IS the Firebase UID that
// firebase-admin hands back after verifying a client's ID token. This avoids
// keeping a separate "local id <-> firebase uid" mapping table — every other
// table's `user_id` foreign key stores that same Firebase UID directly.
// ============================================================================

/** @param {import('knex').Knex} knex */
exports.up = function up(knex) {
  return knex.schema.createTable('users', (table) => {
    table.text('id').primary(); // Firebase UID

    table.string('name').nullable();
    table.string('email').notNullable().unique();

    // ISO 4217 currency code, e.g. "BDT", "USD".
    table.string('currency', 3).notNullable().defaultTo('BDT');

    // Optional denormalized cache of the computed balance (see
    // src/services/balanceService.js). Updated after every transaction
    // write, but GET /balance always recomputes live from `transactions` —
    // this column exists purely as a future fast-read optimization and is
    // never trusted as the source of truth.
    table.decimal('cached_balance', 14, 2).notNullable().defaultTo(0);

    // Adds created_at/updated_at as timestamptz columns, both defaulting to
    // now() on insert. The second argument (true) also makes updated_at
    // default to now() rather than being nullable.
    table.timestamps(true, true);
  });
};

/** @param {import('knex').Knex} knex */
exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('users');
};
