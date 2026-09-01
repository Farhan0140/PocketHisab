import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { savingsPotsApi, type CreateEntryInput, type CreatePotInput } from '../../api/endpoints/savingsPots';
import type { ApiResult } from '../../api/client';
import type { SavingsHistoryEntry, SavingsPot, SavingsPotWithHistory } from '../../types/api';

export const savingsPotKeys = {
  all: ['savings-pots'] as const,
  detail: (id: number) => ['savings-pots', 'detail', id] as const,
};

type PotListResult = ApiResult<SavingsPot[]>;

export function useSavingsPots() {
  return useQuery({
    queryKey: savingsPotKeys.all,
    queryFn: () => savingsPotsApi.list(),
  });
}

export function useSavingsPot(id: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: savingsPotKeys.detail(id),
    queryFn: async () => (await savingsPotsApi.getById(id)).data,
    enabled: Number.isFinite(id),
    // Same reasoning as useDebt's initialData — instant render (even
    // offline) from the pot's summary already sitting in the list cache,
    // instead of showing "not found" while the never-yet-made detail
    // request sits paused. initialDataUpdatedAt: 0 keeps it eligible for an
    // immediate real background refetch once one can succeed.
    initialData: () => {
      const list = queryClient.getQueryData<PotListResult>(savingsPotKeys.all);
      const match = list?.data.find((pot) => pot.id === id);
      return match ? { ...match, history: [] } : undefined;
    },
    initialDataUpdatedAt: 0,
  });
}

function invalidatePots(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: savingsPotKeys.all });
}

function getListSnapshot(queryClient: QueryClient) {
  return queryClient.getQueryData<PotListResult>(savingsPotKeys.all);
}

export function useCreateSavingsPot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePotInput) => savingsPotsApi.create(input),

    // Optimistically appends a placeholder pot (0 balance, so the total-
    // saved figure is unaffected) so it shows up immediately, including
    // while offline. onSettled reconciles with the server's real row.
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: savingsPotKeys.all });
      const previous = getListSnapshot(queryClient);

      if (previous) {
        const optimisticPot: SavingsPot = {
          id: -Date.now(),
          user_id: '',
          title: input.title,
          icon: input.icon ?? null,
          current_amount: '0.00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        queryClient.setQueryData<PotListResult>(savingsPotKeys.all, {
          ...previous,
          data: [...previous.data, optimisticPot],
        });
      }

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(savingsPotKeys.all, context.previous);
    },

    onSettled: () => invalidatePots(queryClient),
  });
}

export function useUpdateSavingsPot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreatePotInput> }) => savingsPotsApi.update(id, input),
    onSuccess: () => invalidatePots(queryClient),
  });
}

export function useDeleteSavingsPot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => savingsPotsApi.remove(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: savingsPotKeys.all });
      const previous = getListSnapshot(queryClient);

      if (previous) {
        const removed = previous.data.find((pot) => pot.id === id);
        const totalSaved = (previous.meta as { total_saved?: number } | null)?.total_saved ?? 0;
        queryClient.setQueryData<PotListResult>(savingsPotKeys.all, {
          ...previous,
          data: previous.data.filter((pot) => pot.id !== id),
          meta: { ...previous.meta, total_saved: totalSaved - Number(removed?.current_amount ?? 0) },
        });
      }

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(savingsPotKeys.all, context.previous);
    },

    onSettled: () => invalidatePots(queryClient),
  });
}

export function useAddSavingsEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CreateEntryInput }) => savingsPotsApi.addEntry(id, input),

    // Optimistically applies the deposit/withdrawal to the list row (and
    // the total-saved figure), plus the detail screen's current_amount and
    // history if it's open — so it's visible right away, offline included.
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: savingsPotKeys.all });

      const previousList = getListSnapshot(queryClient);
      const previousDetail = queryClient.getQueryData<SavingsPotWithHistory>(savingsPotKeys.detail(id));
      const delta = input.type === 'deposit' ? input.amount : -input.amount;

      if (previousList) {
        const totalSaved = (previousList.meta as { total_saved?: number } | null)?.total_saved ?? 0;
        queryClient.setQueryData<PotListResult>(savingsPotKeys.all, {
          ...previousList,
          data: previousList.data.map((pot) =>
            pot.id === id ? { ...pot, current_amount: String(Number(pot.current_amount) + delta) } : pot
          ),
          meta: { ...previousList.meta, total_saved: totalSaved + delta },
        });
      }

      if (previousDetail) {
        const optimisticEntry: SavingsHistoryEntry = {
          id: -Date.now(),
          savings_pot_id: id,
          type: input.type,
          amount: String(input.amount),
          note: input.note ?? null,
          entry_date: input.entry_date ?? new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<SavingsPotWithHistory>(savingsPotKeys.detail(id), {
          ...previousDetail,
          current_amount: String(Number(previousDetail.current_amount) + delta),
          history: [optimisticEntry, ...previousDetail.history],
        });
      }

      return { previousList, previousDetail, id };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousList) queryClient.setQueryData(savingsPotKeys.all, context.previousList);
      if (context?.previousDetail) queryClient.setQueryData(savingsPotKeys.detail(context.id), context.previousDetail);
    },

    onSettled: () => invalidatePots(queryClient),
  });
}
