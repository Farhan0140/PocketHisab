import { apiClient } from '../client';
import type { SavingsEntryType, SavingsHistoryEntry, SavingsPot, SavingsPotWithHistory } from '../../types/api';

export interface CreatePotInput {
  title: string;
  icon?: string | null;
}

export interface CreateEntryInput {
  type: SavingsEntryType;
  amount: number;
  note?: string | null;
  entry_date?: string;
}

export const savingsPotsApi = {
  list: () => apiClient.get<SavingsPot[]>('/savings-pots'),
  getById: (id: number) => apiClient.get<SavingsPotWithHistory>(`/savings-pots/${id}`),
  create: (input: CreatePotInput) => apiClient.post<SavingsPot>('/savings-pots', input),
  update: (id: number, input: Partial<CreatePotInput>) => apiClient.patch<SavingsPot>(`/savings-pots/${id}`, input),
  remove: (id: number) => apiClient.delete<null>(`/savings-pots/${id}`),
  addEntry: (id: number, input: CreateEntryInput) =>
    apiClient.post<{ pot: SavingsPot; entry: SavingsHistoryEntry }>(`/savings-pots/${id}/entries`, input),
  listEntries: (id: number) => apiClient.get<SavingsHistoryEntry[]>(`/savings-pots/${id}/entries`),
};
