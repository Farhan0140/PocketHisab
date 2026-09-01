import { apiClient } from '../client';
import type { User } from '../../types/api';

export const authApi = {
  getMe: () => apiClient.get<User>('/auth/me'),
  updateMe: (updates: { name?: string; currency?: string }) => apiClient.patch<User>('/auth/me', updates),
};
