// ============================================================================
// src/middleware/authMiddleware.js
//
// Mounted once at the top of the /api/v1 router (see src/routes/index.js),
// since every endpoint in this API requires authentication. For each
// request it:
//   1. Reads the "Authorization: Bearer <token>" header.
//   2. Verifies that token with firebase-admin (proves it was really issued
//      by Firebase for this exact project, and hasn't expired).
//   3. Auto-provisions (or fetches) the matching local `users` row.
//   4. Attaches `req.user = { id, email }` for every downstream
//      controller/service to use — they NEVER trust a user id coming from
//      the request body, only from this verified token.
// ============================================================================

const { admin, isConfigured } = require('../config/firebase');
const userService = require('../services/userService');
const { UnauthorizedError, ApiError } = require('../utils/ApiError');
const asyncHandler = require('./asyncHandler');

const authMiddleware = asyncHandler(async (req, res, next) => {
  // See src/config/firebase.js: this flag is false until the user supplies
  // real Firebase service-account credentials in .env. Failing here with a
  // clear 500 is preferable to a confusing crash deep inside firebase-admin.
  if (!isConfigured) {
    throw new ApiError(
      500,
      'Authentication is not configured on the server. A Firebase service account ' +
        '(FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY) must be added to .env.'
    );
  }

  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError('Missing or malformed Authorization header. Expected "Bearer <token>".');
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired authentication token.');
  }

  const user = await userService.findOrCreateFromFirebaseToken({
    uid: decodedToken.uid,
    email: decodedToken.email,
  });

  req.user = { id: user.id, email: user.email };
  next();
});

module.exports = authMiddleware;
