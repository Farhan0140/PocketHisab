// ============================================================================
// src/app.js
//
// Builds and exports the Express application object, WITHOUT calling
// `.listen()`. Keeping app construction separate from server startup
// (index.js) means the app can be imported by tests (or anything else) that
// need an Express app but don't want to actually bind a network port.
// ============================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const apiRouter = require('./routes');
const openapiSpec = require('./docs/openapi');
const requestLogger = require('./middleware/requestLogger');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- API documentation (Swagger UI) -------------------------------------
// Registered BEFORE helmet() on purpose: helmet's default Content-Security-
// Policy blocks the inline <script> Swagger UI uses to boot itself (no
// 'unsafe-inline' by default). Docs are public, unauthenticated, read-only
// documentation (no user data, no cookies) — mounting them ahead of the
// restrictive CSP is a deliberate, low-risk trade-off rather than an
// oversight.
//
// GET /openapi.json - the raw OpenAPI 3.1 document (useful for Postman
//                      import, client codegen, or any other tool).
// GET /docs          - the interactive Swagger UI, rendered from that same
//                      document. Every endpoint has a "Try it out" button —
//                      click "Authorize" and paste a Firebase ID token to
//                      call authenticated endpoints straight from the page.
app.get('/openapi.json', (req, res) => res.json(openapiSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: 'PocketHisab API Reference',
}));

// --- Security headers -------------------------------------------------
app.use(helmet());

// --- CORS ----------------------------------------------------------------
// env.corsOrigin is either the literal string "*" or an array of allowed
// origins parsed from the CORS_ORIGIN env var (see src/config/env.js).
app.use(cors({ origin: env.corsOrigin }));

// --- Body parsing ----------------------------------------------------------
// Express 5 bundles its own JSON body parser, no need for the separate
// `body-parser` package.
app.use(express.json());

// --- Request logging -------------------------------------------------------
// Skip verbose request logs in production. Locally, morgan prints a quick
// one-line summary per request (for scanning a busy terminal at a glance),
// and requestLogger prints the full request/response detail underneath it
// (headers, request body, response body) — see that file for why full body
// logging is dev-only.
if (!env.isProduction) {
  app.use(morgan('dev'));
  app.use(requestLogger);
}

// --- Health check ------------------------------------------------------
// Deliberately OUTSIDE /api/v1 and unauthenticated, so uptime monitors and
// deploy scripts can hit it without a Firebase token. Useful during initial
// setup too: this route works even before Firebase credentials exist.
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' }, error: null, meta: null });
});

// --- API routes --------------------------------------------------------
// Every actual feature endpoint lives under /api/v1 (see src/routes/index.js
// for the full list of mounted resource routers and where authentication is
// applied).
app.use('/api/v1', apiRouter);

// --- 404 + error handling ---------------------------------------------
// Order matters: notFoundHandler catches anything no route matched, and
// errorHandler MUST be registered last so Express recognizes it (by its
// 4-argument signature) as the error-handling middleware.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
