// ============================================================================
// src/db/knex.js
//
// Creates ONE shared Knex instance for the whole app to import. Every
// service in src/services/* requires this file rather than constructing its
// own connection — that keeps us to a single connection pool.
// ============================================================================

const knexLib = require('knex');
const env = require('../config/env');
const knexfile = require('../../knexfile');

const environment = env.nodeEnv === 'production' ? 'production' : 'development';

const knex = knexLib(knexfile[environment]);

module.exports = knex;
