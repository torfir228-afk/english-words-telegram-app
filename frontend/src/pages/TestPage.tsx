import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackButton } from '@telegram-apps/sdk-react';
import { TestQuestion as TestQuestionComponent } from '../components/TestQuestion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { generateTest, submitTest } from '../api/test';
import type { TestQuestion, TestResult } from '../types';

export default function TestPage() {
  const navigate = useNavigate();
  const backButton = useBackButton();
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    backButton?.show();
    loadTest();
  }, []);

  const loadTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await generateTest();

      if (data.questions.length === 0) {
        setError(data.message || 'Нет слов для тестирования. Дождитесь ежедневного урока.');
      } else {
        setQuestions(data.questions);
      }
    } catch (err) {
      setError('Не удалось загрузить тест');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (wordId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [wordId]: answer }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const answerArray = questions.map((q) => ({
        wordId: q.wordId,
        answer: answers[q.wordId] || '',
      }));

      const testResult = await submitTest(answerArray);
      setResult(testResult);

      // Haptic feedback
      if (testResult.percentage >= 80) {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } else {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('warning');
      }
    } catch (err) {
      console.error('Failed to submit test:', err);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered = questions.every((q) => answers[q.wordId]?.trim());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-6xl">📚</div>
        <p className="text-gray-600 text-center">{error}</p>
        <Button onClick={() => navigate('/')}>Вернуться</Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="p-4">
        <Card className="text-center space-y-4">
          <div className="text-6xl">
            {result.percentage >= 80 ? '🎉' : result.percentage >= 50 ? '👍' : '📖'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {result.percentage >= 80
              ? 'Отлично!'
              : result.percentage >= 50
                ? 'Хороший результат'
                : 'Продолжайте учить'}
          </h2>
          <p className="text-4xl font-bold text-primary-500">
            {result.correctAnswers} / {result.totalQuestions}
          </p>
          <p className="text-gray-500">
            Правильных ответов: {result.percentage}%
          </p>
        </Card>

        <div className="mt-6 space-y-3">
          {result.results.map((r, index) => (
            <Card
              key={index}
              className={`border-l-4 ${
                r.correct ? 'border-l-green-500' : 'border-l-red-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {r.correct ? '✓' : '✗'} {r.correctAnswer}
                  </p>
                  {!r.correct && (
                    <p className="text-sm text-gray-500">
                      Ваш ответ: {r.userAnswer || '(пусто)'}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    r.correct
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {r.correct ? 'Верно' : 'Неверно'}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Button fullWidth onClick={() => navigate('/')}>
            Вернуться к категориям
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Тест</h1>
        <p className="text-gray-500 mt-1">
          Ответьте на {questions.length} вопросов
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <TestQuestionComponent
            key={question.id}
            question={question}
            questionNumber={index + 1}
            totalQuestions={questions.length}
            onAnswer={(answer) => handleAnswer(question.wordId, answer)}
            currentAnswer={answers[question.wordId]}
          />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
        >
          {isSubmitting ? 'Проверка...' : 'Проверить ответы'}
        </Button>
      </div>
    </div>
  );
}
