import { apiClient } from './client';
import type { TestQuestion, TestResult } from '../types';

export async function generateTest(): Promise<{ questions: TestQuestion[]; message?: string }> {
  const response = await apiClient.get<{ questions: TestQuestion[]; message?: string }>('/api/test/generate');
  return response.data;
}

export async function submitTest(answers: Array<{ wordId: number; answer: string }>): Promise<TestResult> {
  const response = await apiClient.post<TestResult>('/api/test/submit', { answers });
  return response.data;
}
