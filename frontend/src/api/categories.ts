import { apiClient } from './client';
import type { Category } from '../types';

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get<{ categories: Category[] }>('/api/categories');
  return response.data.categories;
}

export async function toggleCategory(id: number): Promise<{ isSelected: boolean }> {
  const response = await apiClient.put<{ isSelected: boolean }>(`/api/categories/${id}/toggle`);
  return response.data;
}
