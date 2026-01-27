import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBackButton } from '@telegram-apps/sdk-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getSettings, updateSettings, pauseLessons, resumeLessons } from '../api/settings';
import type { UserSettings } from '../types';

export default function SettingsPage() {
  const navigate = useNavigate();
  const backButton = useBackButton();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);

  useEffect(() => {
    backButton?.show();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await getSettings();
      setSettings(data);
      setSelectedHour(data.deliveryHour);
      setSelectedMinute(data.deliveryMinute);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await updateSettings({
        deliveryHour: selectedHour,
        deliveryMinute: selectedMinute,
      });
      setSettings(updated);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleLessons = async () => {
    try {
      if (settings?.isActive) {
        const result = await pauseLessons();
        setSettings((prev) => prev ? { ...prev, isActive: result.isActive } : null);
      } else {
        const result = await resumeLessons();
        setSettings((prev) => prev ? { ...prev, isActive: result.isActive } : null);
      }
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Failed to toggle lessons:', error);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-500 mt-1">
          Настройте время получения уроков
        </p>
      </div>

      {/* Delivery time */}
      <Card className="mb-4">
        <h3 className="font-medium text-gray-900 mb-4">
          Время доставки уроков
        </h3>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm text-gray-500 mb-2 block">Час</label>
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {hours.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-sm text-gray-500 mb-2 block">Минуты</label>
            <select
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-3">
          Текущее время: {settings?.formattedTime}
        </p>
      </Card>

      {/* Lessons status */}
      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-gray-900">Ежедневные уроки</h3>
            <p className="text-sm text-gray-500">
              {settings?.isActive ? 'Включены' : 'Приостановлены'}
            </p>
          </div>
          <button
            onClick={handleToggleLessons}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${settings?.isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
              }
            `}
          >
            {settings?.isActive ? 'Приостановить' : 'Возобновить'}
          </button>
        </div>
      </Card>

      {/* Timezone */}
      <Card className="mb-4">
        <h3 className="font-medium text-gray-900 mb-2">Часовой пояс</h3>
        <p className="text-gray-600">{settings?.timezone}</p>
        <p className="text-xs text-gray-400 mt-1">
          Определяется автоматически
        </p>
      </Card>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="flex-1"
          >
            Назад
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
