// ============================================================================
// src/config/firebase.js
//
// Initializes the firebase-admin SDK exactly once (a module-level singleton
// — requiring this file multiple times always returns the same initialized
// instance, since Node caches modules).
//
// IMPORTANT: this needs a Firebase SERVICE ACCOUNT (FIREBASE_PROJECT_ID,
// FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env), which is different
// from the client-side `firebaseConfig` object used inside the mobile app.
// See .env.example for where to generate one.
//
// Deliberately tolerant of missing credentials: if they are not set (e.g.
// during initial local setup, before the user has generated a service
// account), this file does NOT throw. Instead `isConfigured` is false, and
// src/middleware/authMiddleware.js checks that flag to fail individual
// requests with a clear error rather than crashing the whole server on
// boot. This lets migrations, /health, and any future public routes keep
// working while Firebase credentials are still being set up.
//
// NOTE ON THE IMPORT STYLE: firebase-admin v12+ removed the old namespaced
// compat API (`admin.credential.cert(...)`, `admin.auth()`) from the plain
// `require('firebase-admin')` export — it now only exposes
// initializeApp/getApp/cert/etc. The SDK's documented replacement is the
// "modular" API, imported from its subpaths instead:
// `firebase-admin/app` and `firebase-admin/auth`.
// ============================================================================

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const env = require('../config/env');
const logger = require('../utils/logger');

const { projectId, clientEmail, privateKey } = env.firebase;
const isConfigured = Boolean(projectId && clientEmail && privateKey);

// `auth` stays null until credentials are supplied; authMiddleware checks
// `isConfigured` before ever touching it.
let auth = null;

if (isConfigured) {
  const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  auth = getAuth(app);
} else {
  logger.warn(
    'Firebase Admin credentials are not set (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / ' +
      'FIREBASE_PRIVATE_KEY). The server will still start, but every authenticated endpoint ' +
      'will respond with 500 until these are added to .env. See .env.example for instructions.'
  );
}

module.exports = {
  auth,
  isConfigured,
};
