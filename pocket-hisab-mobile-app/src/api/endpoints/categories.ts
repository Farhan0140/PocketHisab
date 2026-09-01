import { apiClient } from '../client';
import type { Category } from '../../types/api';

export interface CreateCategoryInput {
  name: string;
  icon?: string | null;
  color?: string | null;
}

export const categoriesApi = {
  list: () => apiClient.get<Category[]>('/categories'),
  create: (input: CreateCategoryInput) => apiClient.post<Category>('/categories', input),
  update: (id: number, input: Partial<CreateCategoryInput>) =>
    apiClient.patch<Category>(`/categories/${id}`, input),
  remove: (id: number) => apiClient.delete<null>(`/categories/${id}`),
};
