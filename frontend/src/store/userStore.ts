import { create } from 'zustand';
import type { Category, UserSettings, TestQuestion } from '../types';

interface UserState {
  categories: Category[];
  settings: UserSettings | null;
  currentTest: TestQuestion[];
  isLoading: boolean;
  error: string | null;

  setCategories: (categories: Category[]) => void;
  updateCategory: (id: number, updates: Partial<Category>) => void;
  setSettings: (settings: UserSettings) => void;
  setCurrentTest: (questions: TestQuestion[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  categories: [],
  settings: null,
  currentTest: [],
  isLoading: false,
  error: null,

  setCategories: (categories) => set({ categories }),

  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat
      ),
    })),

  setSettings: (settings) => set({ settings }),

  setCurrentTest: (questions) => set({ currentTest: questions }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));
