// ============================================================================
// src/docs/components/schemas.js
//
// Reusable OpenAPI data-shape definitions ("schemas"), one per database
// entity plus a handful of small shared building blocks (pagination meta,
// the standard error object). Every path definition under src/docs/paths/*
// references these by name (`$ref: '#/components/schemas/Transaction'`)
// instead of repeating the same field list in every endpoint — exactly the
// same reason src/services/* centralizes business logic in one place.
// ============================================================================

const User = {
  type: 'object',
  description:
    'A PocketHisab account. The `id` is the Firebase UID itself — there is no separate ' +
    'internal user id. Rows are auto-created the first time a Firebase-authenticated ' +
    'request reaches the API for that UID (see the auth middleware).',
  properties: {
    id: {
      type: 'string',
      description: 'Firebase UID — also the primary key of this row.',
      example: 'x7QpN3vLskT1a2bYh9mKcRestAB',
    },
    name: { type: 'string', nullable: true, example: 'Rahim Uddin' },
    email: { type: 'string', format: 'email', example: 'rahim@example.com' },
    currency: {
      type: 'string',
      description: 'ISO 4217 currency code used to display all amounts for this user.',
      example: 'BDT',
    },
    cached_balance: {
      type: 'number',
      format: 'decimal',
      description:
        'A denormalized cache of the Total Balance, refreshed after every transaction ' +
        'write. Informational only — GET /balance always recomputes live and should be ' +
        'treated as the source of truth, not this field.',
      example: 12500.5,
    },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const Category = {
  type: 'object',
  description:
    'An expense category. `user_id: null` marks one of the global default categories ' +
    'seeded for every account (Food, Transport, ...); a non-null `user_id` marks a ' +
    'category the user created themselves. `is_active: false` means the category was ' +
    'soft-deleted — it is hidden from "choose a category" lists for new transactions but ' +
    'still displayed correctly on old transactions that reference it.',
  properties: {
    id: { type: 'integer', example: 3 },
    user_id: { type: 'string', nullable: true, example: null },
    name: { type: 'string', example: 'Food' },
    icon: { type: 'string', nullable: true, example: '🍔' },
    color: { type: 'string', nullable: true, example: '#F97316' },
    is_default: { type: 'boolean', example: true },
    is_active: { type: 'boolean', example: true },
    created_at: { type: 'string', format: 'date-time' },
  },
};

const Transaction = {
  type: 'object',
  description:
    'One row of the core ledger. `amount` is always stored positive; `type` determines ' +
    'whether it adds to (income) or subtracts from (expense) the Total Balance. ' +
    '`category_id` is always null for income and always required for expense.',
  properties: {
    id: { type: 'integer', example: 42 },
    user_id: { type: 'string', example: 'x7QpN3vLskT1a2bYh9mKcRestAB' },
    type: { type: 'string', enum: ['income', 'expense'], example: 'expense' },
    amount: { type: 'number', format: 'decimal', example: 250.0 },
    category_id: { type: 'integer', nullable: true, example: 3 },
    note: { type: 'string', nullable: true, example: 'Lunch with the team' },
    transaction_date: { type: 'string', format: 'date', example: '2026-08-31' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const Debt = {
  type: 'object',
  description:
    'Money the user owes to someone else. `status` returned by the API is the ' +
    '**effective** status, recomputed on every read: it is not just whatever was last ' +
    'written to the database, because "is this debt overdue?" changes purely with the ' +
    'passage of time, without any write happening. See GET /debts for the full precedence ' +
    'rule (paid > overdue > partially_paid > pending).',
  properties: {
    id: { type: 'integer', example: 7 },
    user_id: { type: 'string', example: 'x7QpN3vLskT1a2bYh9mKcRestAB' },
    person_name: { type: 'string', example: 'Karim' },
    amount: { type: 'number', format: 'decimal', description: 'Original borrowed amount.', example: 5000 },
    remaining_amount: {
      type: 'number',
      format: 'decimal',
      description: 'Amount still owed. Decreases as repayments are logged; never negative.',
      example: 2000,
    },
    note: { type: 'string', nullable: true, example: 'Borrowed for phone repair' },
    due_date: { type: 'string', format: 'date', nullable: true, example: '2026-09-15' },
    status: {
      type: 'string',
      enum: ['pending', 'partially_paid', 'paid', 'overdue'],
      description: 'The EFFECTIVE status (see schema description above), not a raw DB dump.',
      example: 'partially_paid',
    },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const DebtWithRepayments = {
  allOf: [
    { $ref: '#/components/schemas/Debt' },
    {
      type: 'object',
      properties: {
        repayments: {
          type: 'array',
          items: { $ref: '#/components/schemas/DebtRepayment' },
        },
      },
    },
  ],
};

const DebtRepayment = {
  type: 'object',
  description: 'A single full or partial repayment logged against a debt. Append-only — never edited or deleted.',
  properties: {
    id: { type: 'integer', example: 15 },
    debt_id: { type: 'integer', example: 7 },
    amount: { type: 'number', format: 'decimal', example: 1000 },
    repaid_date: { type: 'string', format: 'date', example: '2026-08-20' },
    note: { type: 'string', nullable: true, example: 'Paid via bKash' },
    created_at: { type: 'string', format: 'date-time' },
  },
};

const Reminder = {
  type: 'object',
  description:
    'A scheduled reminder tied to a debt. This API only stores reminder data — it does ' +
    'NOT send push notifications itself. The mobile app reads reminders and schedules its ' +
    'own local OS notification from `remind_at` + `message`.',
  properties: {
    id: { type: 'integer', example: 4 },
    debt_id: { type: 'integer', example: 7 },
    remind_at: { type: 'string', format: 'date-time', example: '2026-09-12T09:00:00.000Z' },
    message: { type: 'string', example: 'Pay Karim back before Sept 15' },
    is_sent: {
      type: 'boolean',
      description: 'Whether the app has already delivered/acknowledged this reminder locally.',
      example: false,
    },
    created_at: { type: 'string', format: 'date-time' },
  },
};

const SavingsPot = {
  type: 'object',
  description:
    'A manually tracked savings stash (e.g. "Emergency Fund"). Fully independent of Total ' +
    'Balance — deposits and withdrawals here never create a `transactions` row and never ' +
    'change the number returned by GET /balance.',
  properties: {
    id: { type: 'integer', example: 2 },
    user_id: { type: 'string', example: 'x7QpN3vLskT1a2bYh9mKcRestAB' },
    title: { type: 'string', example: 'Emergency Fund' },
    icon: { type: 'string', nullable: true, example: '🏦' },
    current_amount: { type: 'number', format: 'decimal', example: 3000 },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
};

const SavingsPotWithHistory = {
  allOf: [
    { $ref: '#/components/schemas/SavingsPot' },
    {
      type: 'object',
      properties: {
        history: {
          type: 'array',
          items: { $ref: '#/components/schemas/SavingsHistoryEntry' },
        },
      },
    },
  ],
};

const SavingsHistoryEntry = {
  type: 'object',
  description: 'A single deposit or withdrawal against a savings pot. Append-only.',
  properties: {
    id: { type: 'integer', example: 9 },
    savings_pot_id: { type: 'integer', example: 2 },
    type: { type: 'string', enum: ['deposit', 'withdrawal'], example: 'deposit' },
    amount: { type: 'number', format: 'decimal', example: 500 },
    note: { type: 'string', nullable: true, example: 'Monthly top-up' },
    entry_date: { type: 'string', format: 'date', example: '2026-08-31' },
    created_at: { type: 'string', format: 'date-time' },
  },
};

const PaginationMeta = {
  type: 'object',
  description: 'Attached to every paginated list response as the top-level `meta` field.',
  properties: {
    total_count: { type: 'integer', example: 137 },
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 20 },
    total_pages: { type: 'integer', example: 7 },
  },
};

const ErrorObject = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Resource not found' },
    details: {
      nullable: true,
      description: 'Extra machine-readable detail, e.g. Zod validation issues for a 400.',
    },
    stack: {
      type: 'string',
      nullable: true,
      description: 'Only present outside production, as a local-development convenience.',
    },
  },
};

module.exports = {
  User,
  Category,
  Transaction,
  Debt,
  DebtWithRepayments,
  DebtRepayment,
  Reminder,
  SavingsPot,
  SavingsPotWithHistory,
  SavingsHistoryEntry,
  PaginationMeta,
  ErrorObject,
};
