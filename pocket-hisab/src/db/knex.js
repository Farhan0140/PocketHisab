// ============================================================================
// src/db/knex.js
//
// Creates ONE shared Knex instance for the whole app to import. Every
// service in src/services/* requires this file rather than constructing its
// own connection — that keeps us to a single connection pool.
// ============================================================================

const { types: pgTypes } = require('pg');
const knexLib = require('knex');
const env = require('../config/env');
const knexfile = require('../../knexfile');

// By default node-postgres parses a plain DATE column (e.g.
// transactions.transaction_date, debts.due_date, debt_repayments.repaid_date,
// savings_history.entry_date) into a JS Date object representing midnight in
// the SERVER PROCESS's local timezone. Once that gets JSON.stringify'd for
// an HTTP response, it turns into a full UTC datetime string — e.g. a date
// meant to be plain "2026-09-01" becomes "2026-08-31T18:00:00.000Z" for a
// UTC+6 server. That's two bugs at once: the client's date-only parsers
// choke on the unexpected full datetime string ("Invalid Date"), AND the
// calendar date itself can silently shift by a day depending on server/
// client timezone — a real correctness bug, not just a display one.
//
// The fix (straight from node-postgres's own docs for this exact footgun):
// register a type parser for OID 1082 (date) that returns the raw
// "YYYY-MM-DD" string Postgres sent, untouched — no Date object, no
// timezone conversion, ever. This does NOT touch TIMESTAMP/TIMESTAMPTZ
// columns (reminders.remind_at, created_at/updated_at, etc.), which
// legitimately represent a moment in time and should keep parsing as JS
// Dates → full ISO datetime strings.
pgTypes.setTypeParser(pgTypes.builtins.DATE, (value) => value);

const environment = env.nodeEnv === 'production' ? 'production' : 'development';

const knex = knexLib(knexfile[environment]);

module.exports = knex;
