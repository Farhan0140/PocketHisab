# PocketHisab Backend

A REST API for the PocketHisab personal-finance app: balance tracking, income/expense
transactions, categories, debts + repayments, reminders, and savings pots — built with
Express, Knex/Postgres (Neon), and Firebase Authentication.

## Stack

- **Runtime**: Node.js (Express 5)
- **Database**: PostgreSQL (Neon, serverless) via Knex.js (query builder + migrations)
- **Auth**: Firebase Authentication (Email/Password + Google) — the client authenticates
  with Firebase directly; this API only verifies the resulting ID token
- **Validation**: Zod
- **Response shape**: every endpoint returns `{ success, data, error, meta }`

## Project layout

```
src/
├── app.js            # Express app: middleware + route wiring (no .listen())
├── config/            # env.js (typed env vars), firebase.js (firebase-admin init)
├── db/                # knex.js (shared connection), migrations/, seeds/
├── middleware/         # auth, validation, pagination, error handling
├── utils/              # ApiError, response envelope, CSV formatter, logger
├── validators/          # one Zod schema file per resource
├── routes/              # one Express router per resource, mounted under /api/v1
├── controllers/          # thin HTTP-layer glue (routes -> controllers -> services)
└── services/             # all business logic + Knex queries live here
index.js                 # process entrypoint (loads src/app.js and listens)
knexfile.js               # Knex CLI config
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` (already done in this repo — `.env` is git-ignored) and fill
in the blanks. `DATABASE_URL` is already set to the provided Neon connection string.

### 3. Firebase Admin credentials (required for any authenticated endpoint)

The app boots and serves `/health` even without this — but every endpoint under `/api/v1`
will respond `500 Authentication is not configured on the server` until you add a Firebase
**service account** (not the client-side `firebaseConfig` used in the mobile app):

1. Firebase Console → Project Settings → Service Accounts → **Generate new private key**.
2. This downloads a JSON file containing `project_id`, `client_email`, and `private_key`.
3. Copy those three values into `.env`:
   ```
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
   Keep the `\n` sequences literal (as text), not real line breaks — `src/config/env.js`
   converts them back into real newlines at startup.

### 4. Run database migrations + seed default categories

```bash
npm run migrate   # creates all 8 tables in Neon
npm run seed       # inserts the default expense categories (Food, Transport, ...)
```

### 5. Start the server

```bash
npm run dev    # nodemon, auto-restarts on file changes
npm start        # plain node, for production
```

Confirm it's up:

```bash
curl http://localhost:3000/health
```

### 6. API documentation

Interactive, browsable documentation (built with [Swagger UI](https://github.com/swagger-api/swagger-ui))
is served straight from the running server — no separate build step:

- **`GET /docs`** — the interactive Swagger UI. Every endpoint, request/response schema,
  and business rule (balance computation, debt status rules, overpayment guards, etc.) is
  documented here, grouped by resource (tag). Click **"Authorize"** near the top of the
  page, paste a Firebase ID token, and every "Try it out" button below will send it
  automatically — you can call real endpoints straight from the page.
- **`GET /openapi.json`** — the raw OpenAPI 3.1 document behind that UI, for importing into
  Postman/Insomnia or feeding into a codegen tool.

Both are public and unauthenticated by design. The spec source lives in `src/docs/` (one
file per resource under `src/docs/paths/`, shared schemas under `src/docs/components/`) —
keep it in sync whenever a route, validator, or business rule changes.

## Authenticating requests

Every endpoint under `/api/v1` requires `Authorization: Bearer <Firebase ID token>`. The
mobile app obtains this token from the Firebase client SDK after Email/Password or Google
sign-in. There is no `/auth/register` or `/auth/login` endpoint on this API — Firebase
handles that; the very first authenticated request from a new Firebase user automatically
creates their `users` row here.

## Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the server with nodemon (auto-restart) |
| `npm start` | Start the server normally |
| `npm run migrate` | Run all pending migrations |
| `npm run migrate:rollback` | Roll back the last migration batch |
| `npm run migrate:status` | Show which migrations have/haven't run |
| `npm run seed` | Re-run the default-categories seed (idempotent) |

## Design notes

- **Total Balance** is always computed live from `SUM(income) - SUM(expense)` over the
  `transactions` table (see `src/services/balanceService.js`) — never trust a stored
  balance field directly.
- **Debt status**: `paid`/`partially_paid` are written eagerly when a repayment is logged;
  `overdue` is always derived at read time (no cron job) — see
  `debtService.getEffectiveStatus()`.
- **Savings pots** are fully independent of Total Balance — deposits/withdrawals never
  create a transaction row.
- **Categories** are soft-deleted (`is_active = false`) only, so historical transactions
  never lose their category reference.
