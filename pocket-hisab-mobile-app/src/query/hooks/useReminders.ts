import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersApi, type CreateReminderInput } from '../../api/endpoints/reminders';

export const reminderKeys = { all: ['reminders'] as const };

export function useReminders() {
  return useQuery({
    queryKey: reminderKeys.all,
    queryFn: async () => (await remindersApi.list()).data,
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReminderInput) => remindersApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reminderKeys.all }),
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => remindersApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reminderKeys.all }),
  });
}
