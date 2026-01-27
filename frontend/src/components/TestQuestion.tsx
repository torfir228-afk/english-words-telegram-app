import { useState } from 'react';
import { TestQuestion as TestQuestionType } from '../types';
import { Card } from './ui/Card';

interface TestQuestionProps {
  question: TestQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  currentAnswer?: string;
}

export function TestQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  currentAnswer = '',
}: TestQuestionProps) {
  const [value, setValue] = useState(currentAnswer);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onAnswer(newValue);
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Вопрос {questionNumber} из {totalQuestions}
        </span>
        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
          {question.type === 'fill_blank' ? 'Вставьте слово' : 'Переведите'}
        </span>
      </div>

      <div className="text-lg font-medium text-gray-900">
        {question.type === 'fill_blank' ? (
          <p>{question.question}</p>
        ) : (
          <p>
            <span className="text-xl mr-2">🇷🇺</span>
            {question.question}
          </p>
        )}
      </div>

      {question.hint && (
        <p className="text-sm text-gray-500">
          <span className="font-medium">Подсказка:</span> {question.hint}
        </p>
      )}

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Введите ответ..."
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        autoComplete="off"
        autoCapitalize="off"
      />
    </Card>
  );
}
