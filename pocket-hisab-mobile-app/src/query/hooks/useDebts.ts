import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { debtsApi, type CreateDebtInput, type CreateRepaymentInput } from '../../api/endpoints/debts';
import type { ApiResult } from '../../api/client';
import type { Debt, DebtRepayment, DebtStatus, DebtWithRepayments } from '../../types/api';

export const debtKeys = {
  all: ['debts'] as const,
  list: (filters: { status?: DebtStatus; page?: number; limit?: number }) => ['debts', 'list', filters] as const,
  detail: (id: number) => ['debts', 'detail', id] as const,
  upcoming: (days: number) => ['debts', 'upcoming', days] as const,
};

/**
 * Mirrors debtService.getEffectiveStatus() on the backend EXACTLY (same
 * precedence: paid > overdue > partially_paid > pending) — used only to
 * keep optimistic local updates visually consistent with what the server
 * will eventually compute; the server's response always wins once synced.
 */
function computeEffectiveStatus(amount: string | number, remaining: string | number, dueDate: string | null): DebtStatus {
  if (Number(remaining) <= 0) return 'paid';
  if (dueDate) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const dueStr = new Date(dueDate).toISOString().slice(0, 10);
    if (dueStr < todayStr) return 'overdue';
  }
  if (Number(remaining) < Number(amount)) return 'partially_paid';
  return 'pending';
}

export function useDebts(filters: { status?: DebtStatus; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: debtKeys.list(filters),
    queryFn: () => debtsApi.list(filters),
  });
}

export function useDebt(id: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: debtKeys.detail(id),
    queryFn: async () => (await debtsApi.getById(id)).data,
    enabled: Number.isFinite(id),
    // Seeds this screen from whatever list query already has this debt
    // cached, so opening a debt you can already see in the list renders
    // INSTANTLY — including while offline, when the individual detail
    // request (never made before) would otherwise sit paused with no data
    // at all, which is what made an existing debt look like "not found".
    // `initialDataUpdatedAt: 0` marks it stale immediately so a real
    // background fetch (with the full repayment history) still happens as
    // soon as one can succeed.
    initialData: () => {
      const lists = queryClient.getQueriesData<ApiResult<Debt[]>>({
        queryKey: debtKeys.all,
        predicate: (query) => query.queryKey[1] === 'list',
      });
      for (const [, result] of lists) {
        const match = result?.data.find((debt) => debt.id === id);
        if (match) return { ...match, repayments: [] };
      }
      return undefined;
    },
    initialDataUpdatedAt: 0,
  });
}

export function useUpcomingDebts(days = 7) {
  return useQuery({
    queryKey: debtKeys.upcoming(days),
    queryFn: async () => (await debtsApi.upcoming(days)).data,
  });
}

function invalidateDebts(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: debtKeys.all });
}

/** All cached debt LIST queries (as opposed to detail/upcoming, which have a different shape). */
function getDebtListEntries(queryClient: QueryClient) {
  return queryClient.getQueriesData<ApiResult<Debt[]>>({
    queryKey: debtKeys.all,
    predicate: (query) => query.queryKey[1] === 'list',
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtsApi.create(input),

    // Optimistically prepend a placeholder debt to every cached list so it
    // appears IMMEDIATELY — including while offline, when the real request
    // stays queued until reconnect. onSettled below replaces this with the
    // server's real row (real id, computed status) once the write lands.
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: debtKeys.all });
      const previousLists = getDebtListEntries(queryClient);

      const optimisticDebt: Debt = {
        id: -Date.now(),
        user_id: '',
        person_name: input.person_name,
        amount: String(input.amount),
        remaining_amount: String(input.amount),
        note: input.note ?? null,
        due_date: input.due_date ?? null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      for (const [key, result] of previousLists) {
        if (!result) continue;
        queryClient.setQueryData<ApiResult<Debt[]>>(key, {
          ...result,
          data: [optimisticDebt, ...result.data],
        });
      }

      return { previousLists };
    },

    onError: (_err, _input, context) => {
      context?.previousLists?.forEach(([key, result]) => queryClient.setQueryData(key, result));
    },

    onSettled: () => invalidateDebts(queryClient),
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<Omit<CreateDebtInput, 'amount'>> }) =>
      debtsApi.update(id, input),
    onSuccess: () => invalidateDebts(queryClient),
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => debtsApi.remove(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: debtKeys.all });
      const previousLists = getDebtListEntries(queryClient);
      for (const [key, result] of previousLists) {
        if (!result) continue;
        queryClient.setQueryData<ApiResult<Debt[]>>(key, {
          ...result,
          data: result.data.filter((debt) => debt.id !== id),
        });
      }
      return { previousLists };
    },

    onError: (_err, _id, context) => {
      context?.previousLists?.forEach(([key, result]) => queryClient.setQueryData(key, result));
    },

    onSettled: () => invalidateDebts(queryClient),
  });
}

export function useAddRepayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CreateRepaymentInput }) => debtsApi.addRepayment(id, input),

    // Optimistically applies the repayment to BOTH the list row and (if
    // open) the detail screen — remaining_amount, status, and a placeholder
    // repayment prepended to the history — so logging a repayment while
    // offline shows up right away instead of only after reconnecting.
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: debtKeys.all });

      const previousLists = getDebtListEntries(queryClient);
      const previousDetail = queryClient.getQueryData<DebtWithRepayments>(debtKeys.detail(id));

      const applyRepayment = (debt: Debt): Debt => {
        const remaining = Math.max(0, Number(debt.remaining_amount) - input.amount);
        return {
          ...debt,
          remaining_amount: String(remaining),
          status: computeEffectiveStatus(debt.amount, remaining, debt.due_date),
          updated_at: new Date().toISOString(),
        };
      };

      for (const [key, result] of previousLists) {
        if (!result) continue;
        queryClient.setQueryData<ApiResult<Debt[]>>(key, {
          ...result,
          data: result.data.map((debt) => (debt.id === id ? applyRepayment(debt) : debt)),
        });
      }

      if (previousDetail) {
        const optimisticRepayment: DebtRepayment = {
          id: -Date.now(),
          debt_id: id,
          amount: String(input.amount),
          repaid_date: input.repaid_date ?? new Date().toISOString().slice(0, 10),
          note: input.note ?? null,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<DebtWithRepayments>(debtKeys.detail(id), {
          ...applyRepayment(previousDetail),
          repayments: [optimisticRepayment, ...previousDetail.repayments],
        });
      }

      return { previousLists, previousDetail, id };
    },

    onError: (_err, _vars, context) => {
      context?.previousLists?.forEach(([key, result]) => queryClient.setQueryData(key, result));
      if (context?.previousDetail) {
        queryClient.setQueryData(debtKeys.detail(context.id), context.previousDetail);
      }
    },

    onSettled: () => invalidateDebts(queryClient),
  });
}
