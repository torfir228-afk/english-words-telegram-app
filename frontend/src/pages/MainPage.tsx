import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackButton } from '@telegram-apps/sdk-react';
import { CategoryCard } from '../components/CategoryCard';
import { Button } from '../components/ui/Button';
import { useUserStore } from '../store/userStore';
import { getCategories, toggleCategory } from '../api/categories';

export default function MainPage() {
  const navigate = useNavigate();
  const backButton = useBackButton();
  const { categories, setCategories, updateCategory, isLoading, setLoading, setError } = useUserStore();
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null);

  useEffect(() => {
    backButton?.hide();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      setError('Не удалось загрузить категории');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = async (id: number) => {
    try {
      setLoadingCategoryId(id);
      const result = await toggleCategory(id);
      updateCategory(id, { isSelected: result.isSelected });

      // Haptic feedback
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to toggle category:', error);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setLoadingCategoryId(null);
    }
  };

  const selectedCount = categories.filter((c) => c.isSelected).length;
  const totalLearned = categories.reduce((sum, c) => sum + c.wordsLearned, 0);
  const totalWords = categories.reduce((sum, c) => sum + c.totalWords, 0);

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Изучение английского
        </h1>
        <p className="text-gray-500 mt-1">
          Выберите категории для изучения
        </p>
      </div>

      {/* Stats */}
      <div className="bg-primary-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-primary-700">Всего изучено</p>
            <p className="text-2xl font-bold text-primary-900">
              {totalLearned} <span className="text-lg font-normal text-primary-600">/ {totalWords}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-primary-700">Активных категорий</p>
            <p className="text-2xl font-bold text-primary-900">{selectedCount}</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onToggle={handleToggleCategory}
            isLoading={loadingCategoryId === category.id}
          />
        ))}
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/settings')}
            className="flex-1"
          >
            Настройки
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/test')}
            className="flex-1"
            disabled={selectedCount === 0}
          >
            Пройти тест
          </Button>
        </div>
      </div>
    </div>
  );
}
