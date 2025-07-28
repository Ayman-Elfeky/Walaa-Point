import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Gift, 
  BarChart3, 
  Settings, 
  Bell, 
  CreditCard,
  Menu,
  X,
  LogOut,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils';
import toast from 'react-hot-toast';

const DashboardLayout = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const navigation = [
    {
      name: t('navigation.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard'
    },
    {
      name: t('navigation.customers'),
      href: '/customers',
      icon: Users,
      current: location.pathname === '/customers'
    },
    {
      name: t('navigation.rewards'),
      href: '/rewards',
      icon: Gift,
      current: location.pathname === '/rewards'
    },
    {
      name: t('navigation.analytics'),
      href: '/analytics',
      icon: BarChart3,
      current: location.pathname === '/analytics'
    },
    {
      name: t('navigation.subscription'),
      href: '/subscription',
      icon: CreditCard,
      current: location.pathname === '/subscription'
    },
    {
      name: t('navigation.settings'),
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings'
    }
  ];

  const handleNavigation = (href) => {
    navigate(href);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    toast.success(t('auth.signOutSuccess'));
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    toast.success(t('language.changeLanguage'));
  };

  return (
    <div className={cn(
      "min-h-screen bg-secondary-50 dark:bg-gray-900 transition-colors",
      i18n.language === 'ar' ? 'rtl' : 'ltr'
    )}>
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl lg:fixed lg:inset-y-0',
          i18n.language === 'ar' ? 'right-0' : 'left-0',
          sidebarOpen ? 'translate-x-0' : (i18n.language === 'ar' ? 'translate-x-full' : '-translate-x-full'),
          'lg:translate-x-0 transition-transform duration-300 ease-in-out'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100 dark:border-gray-700">
            <div className={cn(
              'flex items-center',
              i18n.language === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'
            )}>
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary-600 rounded"></div>
                </div>
              </div>
              <h1 className="text-xl font-bold text-secondary-900 dark:text-gray-100">Walaa Point</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-secondary-400 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    'flex items-center px-4 py-3 text-secondary-700 dark:text-gray-300 rounded-lg hover:bg-secondary-100 dark:hover:bg-gray-700 transition-colors cursor-pointer w-full group',
                    item.current && 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-r-2 dark:border-primary-400 border-primary-600',
                    i18n.language === 'ar' && item.current && 'border-r-0 border-l-2'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5 transition-colors',
                    i18n.language === 'ar' ? 'ml-3' : 'mr-3'
                  )} />
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-secondary-100 dark:border-gray-700 p-4">
            <div className={cn(
              'flex items-center mb-4',
              i18n.language === 'ar' ? 'space-x-reverse space-x-3' : 'space-x-3'
            )}>
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                  {user?.name?.charAt(0) || 'M'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-gray-100 truncate">
                  {user?.name || 'Merchant'}
                </p>
                <p className="text-xs text-secondary-500 dark:text-gray-400 truncate">
                  {user?.email || 'merchant@example.com'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
            >
              <LogOut className={cn(
                'h-4 w-4',
                i18n.language === 'ar' ? 'ml-2' : 'mr-2'
              )} />
              {t('navigation.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        i18n.language === 'ar' ? 'lg:mr-64' : 'lg:ml-64'
      )}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-secondary-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-secondary-400 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-gray-300"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search & Actions */}
            <div className={cn(
              'flex items-center',
              i18n.language === 'ar' ? 'space-x-reverse space-x-4' : 'space-x-4'
            )}>
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="p-2 text-secondary-400 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-gray-300 hover:bg-secondary-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Globe className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="p-2 text-secondary-400 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-gray-300 hover:bg-secondary-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-secondary-200 dark:border-gray-700 z-50"
                    >
                      <div className="p-4 border-b border-secondary-100 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-secondary-900 dark:text-gray-100">
                          {t('navigation.notifications')}
                        </h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-secondary-500 dark:text-gray-400 text-center">
                          {t('notifications.noNotifications')}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Menu */}
              <div className={cn(
                'flex items-center',
                i18n.language === 'ar' ? 'space-x-reverse space-x-2' : 'space-x-2'
              )}>
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-700 dark:text-primary-400">
                    {user?.name?.charAt(0) || 'M'}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-secondary-900 dark:text-gray-100">
                  {user?.name || 'Merchant'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 