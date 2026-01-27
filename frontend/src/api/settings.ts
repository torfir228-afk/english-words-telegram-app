import { apiClient } from './client';
import type { UserSettings } from '../types';

export async function getSettings(): Promise<UserSettings> {
  const response = await apiClient.get<UserSettings>('/api/settings');
  return response.data;
}

export async function updateSettings(settings: {
  deliveryHour?: number;
  deliveryMinute?: number;
  timezone?: string;
}): Promise<UserSettings> {
  const response = await apiClient.put<UserSettings>('/api/settings', settings);
  return response.data;
}

export async function pauseLessons(): Promise<{ isActive: boolean }> {
  const response = await apiClient.post<{ isActive: boolean }>('/api/settings/pause');
  return response.data;
}

export async function resumeLessons(): Promise<{ isActive: boolean }> {
  const response = await apiClient.post<{ isActive: boolean }>('/api/settings/resume');
  return response.data;
}
