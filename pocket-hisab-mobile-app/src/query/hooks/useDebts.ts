import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { debtsApi, type CreateDebtInput, type CreateRepaymentInput } from '../../api/endpoints/debts';
import type { DebtStatus } from '../../types/api';

export const debtKeys = {
  all: ['debts'] as const,
  list: (filters: { status?: DebtStatus; page?: number; limit?: number }) => ['debts', 'list', filters] as const,
  detail: (id: number) => ['debts', 'detail', id] as const,
  upcoming: (days: number) => ['debts', 'upcoming', days] as const,
};

export function useDebts(filters: { status?: DebtStatus; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: debtKeys.list(filters),
    queryFn: () => debtsApi.list(filters),
  });
}

export function useDebt(id: number) {
  return useQuery({
    queryKey: debtKeys.detail(id),
    queryFn: async () => (await debtsApi.getById(id)).data,
    enabled: Number.isFinite(id),
  });
}

export function useUpcomingDebts(days = 7) {
  return useQuery({
    queryKey: debtKeys.upcoming(days),
    queryFn: async () => (await debtsApi.upcoming(days)).data,
  });
}

function invalidateDebts(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: debtKeys.all });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtsApi.create(input),
    onSuccess: () => invalidateDebts(queryClient),
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
    onSuccess: () => invalidateDebts(queryClient),
  });
}

export function useAddRepayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CreateRepaymentInput }) => debtsApi.addRepayment(id, input),
    onSuccess: () => invalidateDebts(queryClient),
  });
}
