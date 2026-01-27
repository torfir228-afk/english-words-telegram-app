export interface Category {
  id: number;
  name: string;
  displayName: string;
  iconEmoji: string | null;
  totalWords: number;
  isSelected: boolean;
  wordsLearned: number;
  progressPercent: number;
}

export interface Word {
  id: number;
  english: string;
  russian: string;
  category: string;
  examples: Array<{
    sentence: string;
    translation: string | null;
  }>;
  learnedAt?: string;
}

export interface TestQuestion {
  id: number;
  wordId: number;
  type: 'fill_blank' | 'translate';
  question: string;
  hint: string | null;
  correctAnswer: string;
}

export interface TestResult {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  results: Array<{
    wordId: number;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
  }>;
}

export interface UserSettings {
  deliveryHour: number;
  deliveryMinute: number;
  timezone: string;
  isActive: boolean;
  formattedTime: string;
}

export interface Progress {
  totalWords: number;
  totalLearned: number;
  totalPercent: number;
  categories: Array<{
    categoryId: number;
    categoryName: string;
    wordsLearned: number;
    totalWords: number;
    percent: number;
  }>;
}
