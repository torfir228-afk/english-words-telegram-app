import { Category } from '../types';
import { Card } from './ui/Card';
import { Checkbox } from './ui/Checkbox';
import { ProgressBar } from './ui/ProgressBar';

interface CategoryCardProps {
  category: Category;
  onToggle: (id: number) => void;
  isLoading?: boolean;
}

export function CategoryCard({ category, onToggle, isLoading = false }: CategoryCardProps) {
  const handleToggle = () => {
    if (!isLoading) {
      // Haptic feedback
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
      onToggle(category.id);
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={category.isSelected}
          onChange={handleToggle}
          disabled={isLoading}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {category.iconEmoji && (
              <span className="text-xl">{category.iconEmoji}</span>
            )}
            <span className="font-medium text-gray-900">
              {category.displayName}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Изучено</span>
          <span className="text-gray-700 font-medium">
            {category.wordsLearned} / {category.totalWords}
          </span>
        </div>
        <ProgressBar
          value={category.wordsLearned}
          max={category.totalWords}
        />
      </div>
    </Card>
  );
}
