/**
 * Transaction list/detail queries, plus create/update/delete mutations.
 *
 * The create mutation applies an OPTIMISTIC update: the balance and recent-
 * activity caches are adjusted immediately (before the request even
 * resolves), so tapping "Confirm" on Add/Spend Money feels instant — exactly
 * the "optimistic UI, zero perceived latency" requirement from the design
 * doc. If the request ultimately fails, the optimistic change is rolled
 * back; either way, `onSettled` re-fetches from the server so the cache
 * converges on the real values.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  transactionsApi,
  type CreateTransactionInput,
  type ListTransactionsFilters,
} from '../../api/endpoints/transactions';
import { balanceKeys } from './useBalance';
import { dashboardKeys } from './useDashboard';
import type { RecentActivityItem } from '../../types/api';

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters: ListTransactionsFilters) => ['transactions', 'list', filters] as const,
  detail: (id: number) => ['transactions', 'detail', id] as const,
  summary: (period: string, date?: string) => ['transactions', 'summary', period, date] as const,
  byCategory: (start?: string, end?: string) => ['transactions', 'by-category', start, end] as const,
};

export function useTransactions(filters: ListTransactionsFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => transactionsApi.list(filters), // returns { data, meta } — list screen needs both
  });
}

export function useTransactionSummary(period: 'day' | 'month' | 'year', date?: string) {
  return useQuery({
    queryKey: transactionKeys.summary(period, date),
    queryFn: async () => (await transactionsApi.summary(period, date)).data,
  });
}

export function useCategorySummary(start?: string, end?: string) {
  return useQuery({
    queryKey: transactionKeys.byCategory(start, end),
    queryFn: async () => (await transactionsApi.summaryByCategory(start, end)).data,
  });
}

/** Invalidates everything a transaction write can affect: balance, dashboard, and history. */
function invalidateTransactionEffects(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: balanceKeys.all });
  queryClient.invalidateQueries({ queryKey: dashboardKeys.summary });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-activity'] });
  queryClient.invalidateQueries({ queryKey: transactionKeys.all });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => transactionsApi.create(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: balanceKeys.all });
      const previousBalance = queryClient.getQueryData<number>(balanceKeys.all);
      const previousActivity = queryClient.getQueryData<RecentActivityItem[]>(
        dashboardKeys.recentActivity(6)
      );

      const delta = input.type === 'income' ? input.amount : -input.amount;
      if (typeof previousBalance === 'number') {
        queryClient.setQueryData(balanceKeys.all, previousBalance + delta);
      }
      if (previousActivity) {
        const optimisticRow: RecentActivityItem = {
          id: -Date.now(), // negative placeholder id, replaced once the real row invalidates in
          type: input.type,
          amount: String(input.amount),
          note: input.note ?? null,
          transaction_date: input.transaction_date ?? new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
          category_id: input.category_id ?? null,
          category_name: null,
          category_icon: null,
          category_color: null,
        };
        queryClient.setQueryData(dashboardKeys.recentActivity(6), [optimisticRow, ...previousActivity]);
      }

      return { previousBalance, previousActivity };
    },

    onError: (_err, _input, context) => {
      if (context?.previousBalance !== undefined) {
        queryClient.setQueryData(balanceKeys.all, context.previousBalance);
      }
      if (context?.previousActivity !== undefined) {
        queryClient.setQueryData(dashboardKeys.recentActivity(6), context.previousActivity);
      }
    },

    onSettled: () => invalidateTransactionEffects(queryClient),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateTransactionInput> }) =>
      transactionsApi.update(id, input),
    onSettled: () => invalidateTransactionEffects(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.remove(id),
    onSettled: () => invalidateTransactionEffects(queryClient),
  });
}
