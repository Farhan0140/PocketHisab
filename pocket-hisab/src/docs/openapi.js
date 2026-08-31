// ============================================================================
// src/docs/openapi.js
//
// Assembles the complete OpenAPI 3.1 document for the PocketHisab API from
// the schema/path fragments in ./components and ./paths, and is what
// src/app.js hands to Scalar (via @scalar/express-api-reference) to render
// the interactive documentation UI at GET /docs, and serves as raw JSON at
// GET /openapi.json for any other tool (Postman import, codegen, etc.).
//
// Kept as a single source of truth: every field name, validation rule, and
// business rule documented here should match src/validators/*,
// src/services/*, and src/middleware/* exactly — when those change, update
// the matching fragment here too.
// ============================================================================

const schemas = require('./components/schemas');
const healthPaths = require('./paths/health.paths');
const authPaths = require('./paths/auth.paths');
const balancePaths = require('./paths/balance.paths');
const dashboardPaths = require('./paths/dashboard.paths');
const transactionsPaths = require('./paths/transactions.paths');
const categoriesPaths = require('./paths/categories.paths');
const debtsPaths = require('./paths/debts.paths');
const remindersPaths = require('./paths/reminders.paths');
const savingsPotsPaths = require('./paths/savingsPots.paths');
const exportPaths = require('./paths/export.paths');

const openapiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'PocketHisab API',
    version: '1.0.0',
    description:
      '# PocketHisab Backend\n\n' +
      'A personal-finance tracker API: balance, income/expense transactions, categories, ' +
      'debts + repayments, reminders, and savings pots.\n\n' +
      '## Authentication\n\n' +
      'Every endpoint under `/api/v1` (except none — there is no public endpoint) requires ' +
      'a Firebase ID token as a Bearer token: `Authorization: Bearer <token>`. The mobile ' +
      'client signs in directly with Firebase Authentication (Email/Password or Google); ' +
      'this API only verifies the resulting token — it never issues its own credentials, ' +
      'and there are no `/register`/`/login`/`/reset-password` endpoints. The very first ' +
      'authenticated request from a brand-new Firebase account automatically provisions its ' +
      '`users` row.\n\n' +
      '## Response envelope\n\n' +
      'Every JSON response (the file-download endpoints under **Export** are the only ' +
      'exception) has this exact shape:\n\n' +
      '```json\n' +
      '{ "success": true, "data": <payload>, "error": null, "meta": null }\n' +
      '```\n\n' +
      'On failure, `success` is `false`, `data` is `null`, and `error` carries a `message` ' +
      '(plus optional `details`). List endpoints attach pagination info in `meta`.\n\n' +
      '## Key business rules\n\n' +
      '- **Total Balance** (`GET /balance`) is always computed live as ' +
      '`SUM(income) - SUM(expense)` — never a value the client can set directly.\n' +
      '- **Debt status** returned by the API is always the *effective* status, recomputed ' +
      'on every read (overdue depends on "today", which changes without any write).\n' +
      '- **Savings pots** are fully independent of Total Balance — they never create a ' +
      'transaction row.\n' +
      '- **Categories** are soft-deleted only, so historical transactions never lose their ' +
      'category reference.',
    contact: { name: 'PocketHisab' },
  },
  servers: [{ url: '/api/v1', description: 'All resource endpoints (auth required)' }],
  tags: [
    { name: 'Health', description: 'Unauthenticated liveness probe (outside /api/v1).' },
    { name: 'Auth', description: "The current user's own profile." },
    { name: 'Balance', description: 'Computed Total Balance.' },
    { name: 'Dashboard', description: 'Home-screen summary widgets.' },
    { name: 'Transactions', description: "The core ledger — Add Money / Spend Money / History." },
    { name: 'Categories', description: 'Expense categories, default and custom.' },
    { name: 'Debts', description: 'Money owed to others, and repayments against it.' },
    { name: 'Reminders', description: 'Debt reminder data (the app schedules local notifications from this).' },
    { name: 'Savings Pots', description: 'Manually tracked savings, independent of Total Balance.' },
    { name: 'Export', description: 'Downloadable CSV/PDF/JSON exports.' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Firebase ID token',
        description:
          'A Firebase Authentication ID token, obtained client-side after Email/Password or ' +
          'Google sign-in, verified server-side with the firebase-admin SDK on every request.',
      },
    },
    schemas,
  },
  // Applied to every operation by default; health.paths.js overrides this
  // back to an empty array (`security: []`) for its one unauthenticated route.
  security: [{ bearerAuth: [] }],
  paths: {
    ...healthPaths,
    ...authPaths,
    ...balancePaths,
    ...dashboardPaths,
    ...transactionsPaths,
    ...categoriesPaths,
    ...debtsPaths,
    ...remindersPaths,
    ...savingsPotsPaths,
    ...exportPaths,
  },
};

module.exports = openapiSpec;
