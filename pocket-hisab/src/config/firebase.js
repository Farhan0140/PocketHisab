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
// ============================================================================

const admin = require('firebase-admin');
const env = require('../config/env');
const logger = require('../utils/logger');

const { projectId, clientEmail, privateKey } = env.firebase;
const isConfigured = Boolean(projectId && clientEmail && privateKey);

if (isConfigured) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
} else {
  logger.warn(
    'Firebase Admin credentials are not set (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / ' +
      'FIREBASE_PRIVATE_KEY). The server will still start, but every authenticated endpoint ' +
      'will respond with 500 until these are added to .env. See .env.example for instructions.'
  );
}

module.exports = {
  admin,
  isConfigured,
};
