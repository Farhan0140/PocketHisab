/**
 * TypeScript mirrors of the backend's response shapes — see
 * pocket-hisab/src/docs/components/schemas.js for the source of truth
 * (OpenAPI schemas). Keep these two in sync when the backend changes.
 */

/** The standard { success, data, error, meta } envelope every JSON response uses. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: { message: string; details?: unknown } | null;
  meta: PaginationMeta | Record<string, unknown> | null;
}

export interface PaginationMeta {
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  currency: string;
  cached_balance: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  user_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  user_id: string;
  type: TransactionType;
  amount: string;
  category_id: number | null;
  note: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  /**
   * Embedded by GET /transactions only (LEFT JOINed server-side, same as
   * RecentActivityItem below) — absent on the plain Transaction returned by
   * POST/PATCH/GET-by-id. Deliberately NOT filtered by the category's
   * is_active flag, so a transaction whose category was later soft-deleted
   * still carries its original name/icon/color here.
   */
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
}

/** Row shape returned by GET /dashboard/recent-activity (transaction + joined category). */
export interface RecentActivityItem {
  id: number;
  type: TransactionType;
  amount: string;
  note: string | null;
  transaction_date: string;
  created_at: string;
  category_id: number | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
}

export interface PeriodTotals {
  income_total: number;
  expense_total: number;
  net_total: number;
}

export interface DashboardSummary {
  today: PeriodTotals;
  this_month: PeriodTotals;
  this_year: PeriodTotals;
}

export interface TransactionSummary {
  period: 'day' | 'month' | 'year';
  reference_date: string;
  income_total: number;
  expense_total: number;
  net_total: number;
  transaction_count: number;
}

export interface CategorySummaryRow {
  category_id: number | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  total_amount: number;
  transaction_count: number;
}

export type DebtStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue';

export interface Debt {
  id: number;
  user_id: string;
  person_name: string;
  amount: string;
  remaining_amount: string;
  note: string | null;
  due_date: string | null;
  status: DebtStatus;
  created_at: string;
  updated_at: string;
}

export interface DebtRepayment {
  id: number;
  debt_id: number;
  amount: string;
  repaid_date: string;
  note: string | null;
  created_at: string;
}

export interface DebtWithRepayments extends Debt {
  repayments: DebtRepayment[];
}

export interface Reminder {
  id: number;
  debt_id: number;
  remind_at: string;
  message: string;
  is_sent: boolean;
  created_at: string;
}

export interface SavingsPot {
  id: number;
  user_id: string;
  title: string;
  icon: string | null;
  current_amount: string;
  created_at: string;
  updated_at: string;
}

export type SavingsEntryType = 'deposit' | 'withdrawal';

export interface SavingsHistoryEntry {
  id: number;
  savings_pot_id: number;
  type: SavingsEntryType;
  amount: string;
  note: string | null;
  entry_date: string;
  created_at: string;
}

export interface SavingsPotWithHistory extends SavingsPot {
  history: SavingsHistoryEntry[];
}
