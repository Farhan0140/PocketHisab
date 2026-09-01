import { apiClient } from '../client';
import type { Debt, DebtRepayment, DebtStatus, DebtWithRepayments } from '../../types/api';

export interface CreateDebtInput {
  person_name: string;
  amount: number;
  note?: string | null;
  due_date?: string | null;
}

export interface CreateRepaymentInput {
  amount: number;
  repaid_date?: string;
  note?: string | null;
}

export const debtsApi = {
  list: (filters: { status?: DebtStatus; page?: number; limit?: number } = {}) =>
    apiClient.get<Debt[]>('/debts', { ...filters }),

  getById: (id: number) => apiClient.get<DebtWithRepayments>(`/debts/${id}`),

  create: (input: CreateDebtInput) => apiClient.post<Debt>('/debts', input),

  update: (id: number, input: Partial<Omit<CreateDebtInput, 'amount'>>) =>
    apiClient.patch<Debt>(`/debts/${id}`, input),

  remove: (id: number) => apiClient.delete<null>(`/debts/${id}`),

  addRepayment: (id: number, input: CreateRepaymentInput) =>
    apiClient.post<{ debt: Debt; repayment: DebtRepayment }>(`/debts/${id}/repayments`, input),

  listRepayments: (id: number) => apiClient.get<DebtRepayment[]>(`/debts/${id}/repayments`),

  upcoming: (days = 7) => apiClient.get<Debt[]>('/debts/upcoming', { days }),
};
