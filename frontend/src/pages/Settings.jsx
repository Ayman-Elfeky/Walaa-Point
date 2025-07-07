import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Store, 
  Bell,
  Globe,
  Palette,
  Shield,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Save,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Languages,
  Volume2,
  VolumeX,
  Crown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [profileData, setProfileData] = useState({
    name: 'متجر أحمد للألكترونيات',
    email: 'ahmed@example.com',
    phone: '+966501234567',
    address: 'الرياض، المملكة العربية السعودية',
    description: 'متخصصون في بيع الأجهزة الإلكترونية والهواتف الذكية',
    website: 'https://ahmed-electronics.com',
    logo: null
  });

  const [loyaltySettings, setLoyaltySettings] = useState({
    pointsPerRiyal: 1,
    minOrderForPoints: 50,
    maxPointsPerOrder: 500,
    pointsExpiry: 365,
    welcomeBonus: 100,
    referralBonus: 50,
    tierBronze: 0,
    tierSilver: 1000,
    tierGold: 5000,
    tierPlatinum: 15000
  });

  const [notifications, setNotifications] = useState({
    emailNewCustomer: true,
    emailOrderComplete: true,
    emailPointsEarned: false,
    emailRewardRedeemed: true,
    emailWeeklyReport: true,
    emailMonthlyReport: false,
    appNewCustomer: true,
    appOrderComplete: true,
    appPointsEarned: true,
    appRewardRedeemed: true,
    appLowStock: true,
    appSystemUpdates: true
  });

  const [appearance, setAppearance] = useState({
    language: i18n.language,
    primaryColor: '#3b82f6',
    currency: 'SAR',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'en'
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 60
  });

  const tabs = [
    { id: 'profile', name: t('settings.profile'), icon: User },
    { id: 'loyalty', name: t('settings.loyalty'), icon: SettingsIcon },
    { id: 'notifications', name: t('settings.notifications'), icon: Bell },
    { id: 'appearance', name: t('settings.appearance'), icon: Palette },
    { id: 'security', name: t('settings.security'), icon: Shield }
  ];

  const handleSave = async (section) => {
    try {
      setLoading(true);
      // Here you would make API calls to save the settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success(t('settings.settingsUpdated'));
    } catch (error) {
      toast.error(`Failed to save ${section} settings`);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    setAppearance(prev => ({ ...prev, language }));
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.storeInformation')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.storeName')}
            </label>
            <input
              type="text"
              className="input"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.emailAddress')}
            </label>
            <input
              type="email"
              className="input"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.phoneNumber')}
            </label>
            <input
              type="tel"
              className="input"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.website')}
            </label>
            <input
              type="url"
              className="input"
              value={profileData.website}
              onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.address')}
            </label>
            <input
              type="text"
              className="input"
              value={profileData.address}
              onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('common.description')}
            </label>
            <textarea
              className="input"
              rows={3}
              value={profileData.description}
              onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => handleSave('profile')}
          disabled={loading}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('settings.saveChanges')}
        </button>
      </div>
    </div>
  );

  const renderLoyaltyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.pointsConfiguration')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.pointsPerRiyal')}
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              className="input"
              value={loyaltySettings.pointsPerRiyal}
              onChange={(e) => setLoyaltySettings(prev => ({ ...prev, pointsPerRiyal: parseFloat(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.minimumOrderForPoints')}
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={loyaltySettings.minOrderForPoints}
              onChange={(e) => setLoyaltySettings(prev => ({ ...prev, minOrderForPoints: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.maximumPointsPerOrder')}
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={loyaltySettings.maxPointsPerOrder}
              onChange={(e) => setLoyaltySettings(prev => ({ ...prev, maxPointsPerOrder: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.pointsExpiry')}
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={loyaltySettings.pointsExpiry}
              onChange={(e) => setLoyaltySettings(prev => ({ ...prev, pointsExpiry: parseInt(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.bonusPoints')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.welcomeBonus')}
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={loyaltySettings.welcomeBonus}
              onChange={(e) => setLoyaltySettings(prev => ({ ...prev, welcomeBonus: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.referralBonus')}
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={loyaltySettings.referralBonus}
              onChange={(e) => setLoyaltySettings(prev => ({ ...prev, referralBonus: parseInt(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.tierThresholds')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.silverTier')}
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={loyaltySettings.tierSilver}
              onChange={(e) => setLoyaltySettings(prev => ({ ...prev, tierSilver: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.goldTier')}
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={loyaltySettings.tierGold}
              onChange={(e) => setLoyaltySettings(prev => ({ ...prev, tierGold: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.platinumTier')}
            </label>
            <input
              type="number"
              min="0"
              className="input"
              value={loyaltySettings.tierPlatinum}
              onChange={(e) => setLoyaltySettings(prev => ({ ...prev, tierPlatinum: parseInt(e.target.value) }))}
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => handleSave('loyalty')}
          disabled={loading}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('settings.saveSettings')}
        </button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.emailNotifications')}</h3>
        <div className="space-y-4">
          {[
            { key: 'emailNewCustomer', label: t('settings.newCustomerRegistration'), description: t('settings.newCustomerRegistrationDesc') },
            { key: 'emailOrderComplete', label: t('settings.orderCompletion'), description: t('settings.orderCompletionDesc') },
            { key: 'emailPointsEarned', label: t('settings.pointsEarned'), description: t('settings.pointsEarnedDesc') },
            { key: 'emailRewardRedeemed', label: t('settings.rewardRedemption'), description: t('settings.rewardRedemptionDesc') },
            { key: 'emailWeeklyReport', label: t('settings.weeklyReports'), description: t('settings.weeklyReportsDesc') },
            { key: 'emailMonthlyReport', label: t('settings.monthlyReports'), description: t('settings.monthlyReportsDesc') }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-secondary-400 mr-3 rtl:mr-0 rtl:ml-3" />
                <div>
                  <span className="text-secondary-900 dark:text-gray-100 font-medium">{item.label}</span>
                  <p className="text-sm text-secondary-600 dark:text-gray-300 mt-1">{item.description}</p>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.inAppNotifications')}</h3>
        <div className="space-y-4">
          {[
            { key: 'appNewCustomer', label: t('settings.newCustomerAlerts'), description: t('settings.newCustomerAlertsDesc') },
            { key: 'appOrderComplete', label: t('settings.orderCompletionAlerts'), description: t('settings.orderCompletionAlertsDesc') },
            { key: 'appPointsEarned', label: t('settings.pointsActivity'), description: t('settings.pointsActivityDesc') },
            { key: 'appRewardRedeemed', label: t('settings.rewardRedemptions'), description: t('settings.rewardRedemptionsDesc') },
            { key: 'appLowStock', label: t('settings.lowStockWarnings'), description: t('settings.lowStockWarningsDesc') },
            { key: 'appSystemUpdates', label: t('settings.systemUpdates'), description: t('settings.systemUpdatesDesc') }
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <Bell className="h-5 w-5 text-secondary-400 mr-3 rtl:mr-0 rtl:ml-3" />
                <div>
                  <span className="text-secondary-900 dark:text-gray-100 font-medium">{item.label}</span>
                  <p className="text-sm text-secondary-600 dark:text-gray-300 mt-1">{item.description}</p>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={(e) => setNotifications(prev => ({ ...prev, [item.key]: e.target.checked }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start">
          <Bell className="h-5 w-5 text-blue-500 mr-3 rtl:mr-0 rtl:ml-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">{t('settings.notificationSettings')}</h4>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              {t('settings.notificationSettingsDesc')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => handleSave('notifications')}
          disabled={loading}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('settings.savePreferences')}
        </button>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.appearance')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.language')}
            </label>
            <select
              className="input"
              value={appearance.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.theme')}
            </label>
            <select
              className="input"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">{t('settings.light')}</option>
              <option value="dark">{t('settings.dark')}</option>
              <option value="auto">{t('settings.auto')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.currency')}
            </label>
            <select
              className="input"
              value={appearance.currency}
              onChange={(e) => setAppearance(prev => ({ ...prev, currency: e.target.value }))}
            >
              <option value="SAR">Saudi Riyal (SAR)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.dateFormat')}
            </label>
            <select
              className="input"
              value={appearance.dateFormat}
              onChange={(e) => setAppearance(prev => ({ ...prev, dateFormat: e.target.value }))}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => handleSave('appearance')}
          disabled={loading}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('settings.applyChanges')}
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.changePassword')}</h3>
        <div className="grid grid-cols-1 gap-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10 rtl:pr-3 rtl:pl-10"
                value={security.currentPassword}
                onChange={(e) => setSecurity(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 px-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.newPassword')}
            </label>
            <input
              type="password"
              className="input"
              value={security.newPassword}
              onChange={(e) => setSecurity(prev => ({ ...prev, newPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.confirmNewPassword')}
            </label>
            <input
              type="password"
              className="input"
              value={security.confirmPassword}
              onChange={(e) => setSecurity(prev => ({ ...prev, confirmPassword: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.securityOptions')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Key className="h-5 w-5 text-secondary-400 mr-3 rtl:mr-0 rtl:ml-3" />
              <div>
                <span className="text-secondary-900 dark:text-gray-100 block">{t('settings.twoFactorAuthentication')}</span>
                <span className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.twoFactorDesc')}</span>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={security.twoFactorEnabled}
                onChange={(e) => setSecurity(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-secondary-400 mr-3 rtl:mr-0 rtl:ml-3" />
              <div>
                <span className="text-secondary-900 dark:text-gray-100 block">{t('settings.loginNotifications')}</span>
                <span className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.loginNotificationsDesc')}</span>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={security.loginNotifications}
                onChange={(e) => setSecurity(prev => ({ ...prev, loginNotifications: e.target.checked }))}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => handleSave('security')}
          disabled={loading}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('settings.updateSecurity')}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'loyalty': return renderLoyaltyTab();
      case 'notifications': return renderNotificationsTab();
      case 'appearance': return renderAppearanceTab();
      case 'security': return renderSecurityTab();
      default: return renderProfileTab();
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-gray-100">
          {t('settings.title')}
        </h1>
        <p className="text-secondary-600 dark:text-gray-300 mt-1">
          {t('settings.manageStoreSettings')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-secondary-600 hover:bg-secondary-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 rtl:mr-0 rtl:ml-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="card"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 