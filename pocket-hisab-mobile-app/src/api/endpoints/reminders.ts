import { apiClient } from '../client';
import type { Reminder } from '../../types/api';

export interface CreateReminderInput {
  debt_id: number;
  remind_at: string;
  message: string;
}

export const remindersApi = {
  list: () => apiClient.get<Reminder[]>('/reminders'),
  create: (input: CreateReminderInput) => apiClient.post<Reminder>('/reminders', input),
  update: (id: number, input: Partial<{ remind_at: string; message: string; is_sent: boolean }>) =>
    apiClient.patch<Reminder>(`/reminders/${id}`, input),
  remove: (id: number) => apiClient.delete<null>(`/reminders/${id}`),
};
