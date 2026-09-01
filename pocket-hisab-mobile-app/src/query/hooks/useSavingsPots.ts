import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savingsPotsApi, type CreateEntryInput, type CreatePotInput } from '../../api/endpoints/savingsPots';

export const savingsPotKeys = {
  all: ['savings-pots'] as const,
  detail: (id: number) => ['savings-pots', 'detail', id] as const,
};

export function useSavingsPots() {
  return useQuery({
    queryKey: savingsPotKeys.all,
    queryFn: () => savingsPotsApi.list(),
  });
}

export function useSavingsPot(id: number) {
  return useQuery({
    queryKey: savingsPotKeys.detail(id),
    queryFn: async () => (await savingsPotsApi.getById(id)).data,
    enabled: Number.isFinite(id),
  });
}

function invalidatePots(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: savingsPotKeys.all });
}

export function useCreateSavingsPot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePotInput) => savingsPotsApi.create(input),
    onSuccess: () => invalidatePots(queryClient),
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
    onSuccess: () => invalidatePots(queryClient),
  });
}

export function useAddSavingsEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CreateEntryInput }) => savingsPotsApi.addEntry(id, input),
    onSuccess: () => invalidatePots(queryClient),
  });
}
