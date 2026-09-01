import { useQuery } from '@tanstack/react-query';
import { balanceApi } from '../../api/endpoints/balance';

export const balanceKeys = { all: ['balance'] as const };

export function useBalance() {
  return useQuery({
    queryKey: balanceKeys.all,
    queryFn: async () => (await balanceApi.get()).data.balance,
  });
}
