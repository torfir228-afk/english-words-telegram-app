import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useLaunchParams, useInitData, useBackButton } from '@telegram-apps/sdk-react';
import MainPage from './pages/MainPage';
import TestPage from './pages/TestPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  const launchParams = useLaunchParams();
  const initData = useInitData();
  const backButton = useBackButton();

  useEffect(() => {
    // Apply Telegram theme
    document.documentElement.style.setProperty(
      '--tg-theme-bg-color',
      launchParams?.themeParams?.bgColor || '#ffffff'
    );
    document.documentElement.style.setProperty(
      '--tg-theme-text-color',
      launchParams?.themeParams?.textColor || '#000000'
    );
  }, [launchParams]);

  useEffect(() => {
    // Hide back button on main page, show on others
    const handleBackButton = () => {
      window.history.back();
    };

    backButton?.on('click', handleBackButton);

    return () => {
      backButton?.off('click', handleBackButton);
    };
  }, [backButton]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
