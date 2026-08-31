// ============================================================================
// src/docs/paths/health.paths.js — GET /health
// ============================================================================

module.exports = {
  '/health': {
    // Overrides the document-level `servers` (which points at /api/v1) back
    // to root, since /health deliberately lives OUTSIDE the /api/v1 prefix.
    servers: [{ url: '/', description: 'Root — outside /api/v1' }],
    get: {
      tags: ['Health'],
      summary: 'Health check',
      description:
        'Unauthenticated liveness probe. Deliberately outside `/api/v1` and requires no ' +
        'Firebase token, so uptime monitors and deploy scripts can call it even before ' +
        'Firebase Admin credentials are configured on the server.',
      security: [],
      responses: {
        200: {
          description: 'The server is up.',
          content: {
            'application/json': {
              example: { success: true, data: { status: 'ok' }, error: null, meta: null },
            },
          },
        },
      },
    },
  },
};
