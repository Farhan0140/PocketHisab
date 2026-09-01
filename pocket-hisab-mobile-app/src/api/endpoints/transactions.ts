import { apiClient } from '../client';
import type { CategorySummaryRow, Transaction, TransactionSummary, TransactionType } from '../../types/api';

export interface ListTransactionsFilters {
  type?: TransactionType;
  category_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  category_id?: number | null;
  note?: string | null;
  transaction_date?: string;
}

export const transactionsApi = {
  list: (filters: ListTransactionsFilters = {}) =>
    apiClient.get<Transaction[]>('/transactions', { ...filters }),

  getById: (id: number) => apiClient.get<Transaction>(`/transactions/${id}`),

  create: (input: CreateTransactionInput) => apiClient.post<Transaction>('/transactions', input),

  update: (id: number, input: Partial<CreateTransactionInput>) =>
    apiClient.patch<Transaction>(`/transactions/${id}`, input),

  remove: (id: number) => apiClient.delete<null>(`/transactions/${id}`),

  summary: (period: 'day' | 'month' | 'year', date?: string) =>
    apiClient.get<TransactionSummary>('/transactions/summary', { period, date }),

  summaryByCategory: (start_date?: string, end_date?: string) =>
    apiClient.get<CategorySummaryRow[]>('/transactions/summary/by-category', { start_date, end_date }),
};
