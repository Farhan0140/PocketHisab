import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/endpoints/auth';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: { name?: string; currency?: string }) => authApi.updateMe(updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  });
}
