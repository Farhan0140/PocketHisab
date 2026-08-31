// ============================================================================
// knexfile.js
//
// Configuration consumed by the Knex CLI (`npx knex migrate:latest`, etc.)
// AND by src/db/knex.js at runtime. Both read the same DATABASE_URL so the
// schema the CLI manages is always the same database the app talks to.
//
// Neon (like most managed Postgres providers) requires SSL on every
// connection, including the pooled "-pooler" endpoint used here. We disable
// certificate authority verification (`rejectUnauthorized: false`) because
// Neon's certificate chain is not always present in every Node/OS trust
// store — this still encrypts the connection, it just skips CA pinning.
// ============================================================================

require('dotenv').config();

const sharedConnection = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
};

/** @type { Object.<string, import("knex").Knex.Config> } */
module.exports = {
  development: {
    client: 'pg',
    connection: sharedConnection,
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },

  production: {
    client: 'pg',
    connection: sharedConnection,
    // A small pool is plenty for a single-instance API talking to Neon's own
    // connection pooler (the "-pooler" host in DATABASE_URL already pools
    // connections on Neon's side).
    pool: { min: 2, max: 10 },
    migrations: {
      directory: './src/db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
  },
};
