import { apiClient } from '../client';

export const balanceApi = {
  get: () => apiClient.get<{ balance: number }>('/balance'),
};
