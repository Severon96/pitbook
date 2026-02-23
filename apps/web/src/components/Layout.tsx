import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                to="/"
                className="flex items-center px-2 text-xl font-bold text-gray-900 dark:text-white"
              >
                🏁 Pitbook
              </Link>
              <div className="ml-6 flex space-x-4">
                <Link
                  to="/"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === '/'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  to="/vehicles"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive('/vehicles')
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('nav.vehicles')}
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <LanguageSwitcher />
              {user && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user.username}
                  </span>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
