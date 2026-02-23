import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light' as const, label: t('theme.light'), icon: '☀️' },
    { value: 'dark' as const, label: t('theme.dark'), icon: '🌙' },
    { value: 'system' as const, label: t('theme.system'), icon: '💻' },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[2];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        aria-label={t('theme.toggle')}
      >
        <span className="text-lg">{currentTheme.icon}</span>
        <span className="hidden sm:inline">{currentTheme.label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1" role="menu">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    theme === themeOption.value
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                  role="menuitem"
                >
                  <span className="text-lg">{themeOption.icon}</span>
                  <span>{themeOption.label}</span>
                  {theme === themeOption.value && (
                    <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
