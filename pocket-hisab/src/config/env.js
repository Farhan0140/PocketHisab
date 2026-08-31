// ============================================================================
// src/config/env.js
//
// Single, central place that reads `process.env` and turns it into a typed,
// already-validated JavaScript object. Every other file in the app should
// `require('./config/env')` instead of reading `process.env` directly — this
// keeps environment-variable parsing quirks (like the Firebase private key's
// escaped newlines) in exactly one place.
// ============================================================================

// Load variables from the local .env file into process.env. In real
// production deployments (Docker, PaaS, etc.) the platform usually injects
// env vars directly and this call is a harmless no-op if no .env is found.
require('dotenv').config();

/**
 * Firebase Admin private keys are stored in .env as a single line with
 * literal "\n" characters (because env files/vars cannot contain real
 * newlines). We have to turn those literal "\n" sequences back into actual
 * newline characters before handing the key to firebase-admin, otherwise
 * the PEM parser rejects it.
 */
function unescapeNewlines(value) {
  if (!value) return value;
  return value.replace(/\\n/g, '\n');
}

const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Comma-separated origins in .env become a real array here. "*" is passed
  // straight through so the cors() middleware can special-case it.
  corsOrigin:
    process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN
      ? '*'
      : process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),

  databaseUrl: process.env.DATABASE_URL || '',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: unescapeNewlines(process.env.FIREBASE_PRIVATE_KEY || ''),
  },
};

// Fail fast on the one variable that has no safe fallback: without a
// database there is nothing this API can do at all. Firebase credentials are
// intentionally NOT required here (see src/config/firebase.js) so that the
// server can still boot, run migrations, and serve /health before the
// Firebase service account has been supplied.
if (!env.databaseUrl) {
  throw new Error(
    'Missing required environment variable DATABASE_URL. Copy .env.example to .env and fill it in.'
  );
}

module.exports = env;
