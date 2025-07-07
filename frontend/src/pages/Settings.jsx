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
  Crown,
  Gift,
  Percent,
  Truck,
  DollarSign,
  Package,
  Plus,
  Trash2,
  Edit,
  Check,
  X
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
    tierPlatinum: 15000,
    // Redemption Options
    redemptionOptions: {
      percentageDiscount: {
        enabled: true,
        value: 10, // 10%
        pointsRequired: 100,
        minOrderValue: 50,
        maxUsagePerCustomer: 3
      },
      fixedDiscount: {
        enabled: true,
        value: 25, // 25 SAR
        pointsRequired: 250,
        minOrderValue: 100,
        maxUsagePerCustomer: 2
      },
      freeShipping: {
        enabled: true,
        pointsRequired: 50,
        minOrderValue: 30,
        maxUsagePerCustomer: 5
      },
      cashback: {
        enabled: false,
        value: 15, // 15 SAR
        pointsRequired: 200,
        maxUsagePerCustomer: 1
      },
      productRewards: {
        enabled: false,
        pointsRequired: 500,
        maxUsagePerCustomer: 1
      },
      giftCards: {
        enabled: false,
        value: 50, // 50 SAR
        pointsRequired: 500,
        maxUsagePerCustomer: 2
      },
      customRules: {
        enabled: false,
        rules: []
      }
    }
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

      {/* Redemption Options Section */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-2">{t('settings.redemptionOptions')}</h3>
        <p className="text-sm text-secondary-600 dark:text-gray-400 mb-6">{t('settings.redemptionOptionsDesc')}</p>
        
        <div className="space-y-6">
          {/* Percentage Discount */}
          <div className="p-6 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Percent className="h-6 w-6 text-blue-500 mr-3 rtl:mr-0 rtl:ml-3" />
                <div>
                  <h4 className="text-lg font-medium text-secondary-900 dark:text-gray-100">{t('settings.percentageDiscountLabel')}</h4>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.percentageDiscountDesc')}</p>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={loyaltySettings.redemptionOptions.percentageDiscount.enabled}
                  onChange={(e) => setLoyaltySettings(prev => ({
                    ...prev,
                    redemptionOptions: {
                      ...prev.redemptionOptions,
                      percentageDiscount: {
                        ...prev.redemptionOptions.percentageDiscount,
                        enabled: e.target.checked
                      }
                    }
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {loyaltySettings.redemptionOptions.percentageDiscount.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.discountValue')} (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="input"
                    value={loyaltySettings.redemptionOptions.percentageDiscount.value}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        percentageDiscount: {
                          ...prev.redemptionOptions.percentageDiscount,
                          value: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.pointsRequired')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.percentageDiscount.pointsRequired}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        percentageDiscount: {
                          ...prev.redemptionOptions.percentageDiscount,
                          pointsRequired: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.minOrderValue')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={loyaltySettings.redemptionOptions.percentageDiscount.minOrderValue}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        percentageDiscount: {
                          ...prev.redemptionOptions.percentageDiscount,
                          minOrderValue: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.maxUsagePerCustomer')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.percentageDiscount.maxUsagePerCustomer}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        percentageDiscount: {
                          ...prev.redemptionOptions.percentageDiscount,
                          maxUsagePerCustomer: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fixed Discount */}
          <div className="p-6 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-green-500 mr-3 rtl:mr-0 rtl:ml-3" />
                <div>
                  <h4 className="text-lg font-medium text-secondary-900 dark:text-gray-100">{t('settings.fixedDiscountLabel')}</h4>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.fixedDiscountDesc')}</p>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={loyaltySettings.redemptionOptions.fixedDiscount.enabled}
                  onChange={(e) => setLoyaltySettings(prev => ({
                    ...prev,
                    redemptionOptions: {
                      ...prev.redemptionOptions,
                      fixedDiscount: {
                        ...prev.redemptionOptions.fixedDiscount,
                        enabled: e.target.checked
                      }
                    }
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {loyaltySettings.redemptionOptions.fixedDiscount.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.discountValue')} (SAR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.fixedDiscount.value}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        fixedDiscount: {
                          ...prev.redemptionOptions.fixedDiscount,
                          value: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.pointsRequired')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.fixedDiscount.pointsRequired}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        fixedDiscount: {
                          ...prev.redemptionOptions.fixedDiscount,
                          pointsRequired: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.minOrderValue')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={loyaltySettings.redemptionOptions.fixedDiscount.minOrderValue}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        fixedDiscount: {
                          ...prev.redemptionOptions.fixedDiscount,
                          minOrderValue: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.maxUsagePerCustomer')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.fixedDiscount.maxUsagePerCustomer}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        fixedDiscount: {
                          ...prev.redemptionOptions.fixedDiscount,
                          maxUsagePerCustomer: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Free Shipping */}
          <div className="p-6 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Truck className="h-6 w-6 text-orange-500 mr-3 rtl:mr-0 rtl:ml-3" />
                <div>
                  <h4 className="text-lg font-medium text-secondary-900 dark:text-gray-100">{t('settings.freeShippingRedemption')}</h4>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.freeShippingDesc')}</p>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={loyaltySettings.redemptionOptions.freeShipping.enabled}
                  onChange={(e) => setLoyaltySettings(prev => ({
                    ...prev,
                    redemptionOptions: {
                      ...prev.redemptionOptions,
                      freeShipping: {
                        ...prev.redemptionOptions.freeShipping,
                        enabled: e.target.checked
                      }
                    }
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {loyaltySettings.redemptionOptions.freeShipping.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.pointsRequired')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.freeShipping.pointsRequired}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        freeShipping: {
                          ...prev.redemptionOptions.freeShipping,
                          pointsRequired: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.minOrderValue')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={loyaltySettings.redemptionOptions.freeShipping.minOrderValue}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        freeShipping: {
                          ...prev.redemptionOptions.freeShipping,
                          minOrderValue: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.maxUsagePerCustomer')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.freeShipping.maxUsagePerCustomer}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        freeShipping: {
                          ...prev.redemptionOptions.freeShipping,
                          maxUsagePerCustomer: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cashback */}
          <div className="p-6 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 text-purple-500 mr-3 rtl:mr-0 rtl:ml-3" />
                <div>
                  <h4 className="text-lg font-medium text-secondary-900 dark:text-gray-100">{t('settings.cashbackRedemption')}</h4>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.cashbackDesc')}</p>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={loyaltySettings.redemptionOptions.cashback.enabled}
                  onChange={(e) => setLoyaltySettings(prev => ({
                    ...prev,
                    redemptionOptions: {
                      ...prev.redemptionOptions,
                      cashback: {
                        ...prev.redemptionOptions.cashback,
                        enabled: e.target.checked
                      }
                    }
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {loyaltySettings.redemptionOptions.cashback.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.cashbackValue')} (SAR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.cashback.value}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        cashback: {
                          ...prev.redemptionOptions.cashback,
                          value: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.pointsRequired')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.cashback.pointsRequired}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        cashback: {
                          ...prev.redemptionOptions.cashback,
                          pointsRequired: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.maxUsagePerCustomer')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.cashback.maxUsagePerCustomer}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        cashback: {
                          ...prev.redemptionOptions.cashback,
                          maxUsagePerCustomer: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Product Rewards */}
          <div className="p-6 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Package className="h-6 w-6 text-indigo-500 mr-3 rtl:mr-0 rtl:ml-3" />
                <div>
                  <h4 className="text-lg font-medium text-secondary-900 dark:text-gray-100">{t('settings.productRedemption')}</h4>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.productRewardsDesc')}</p>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={loyaltySettings.redemptionOptions.productRewards.enabled}
                  onChange={(e) => setLoyaltySettings(prev => ({
                    ...prev,
                    redemptionOptions: {
                      ...prev.redemptionOptions,
                      productRewards: {
                        ...prev.redemptionOptions.productRewards,
                        enabled: e.target.checked
                      }
                    }
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {loyaltySettings.redemptionOptions.productRewards.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.pointsRequired')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.productRewards.pointsRequired}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        productRewards: {
                          ...prev.redemptionOptions.productRewards,
                          pointsRequired: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.maxUsagePerCustomer')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.productRewards.maxUsagePerCustomer}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        productRewards: {
                          ...prev.redemptionOptions.productRewards,
                          maxUsagePerCustomer: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Gift Cards */}
          <div className="p-6 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Gift className="h-6 w-6 text-pink-500 mr-3 rtl:mr-0 rtl:ml-3" />
                <div>
                  <h4 className="text-lg font-medium text-secondary-900 dark:text-gray-100">{t('settings.giftCardRedemption')}</h4>
                  <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.giftCardDesc')}</p>
                </div>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={loyaltySettings.redemptionOptions.giftCards.enabled}
                  onChange={(e) => setLoyaltySettings(prev => ({
                    ...prev,
                    redemptionOptions: {
                      ...prev.redemptionOptions,
                      giftCards: {
                        ...prev.redemptionOptions.giftCards,
                        enabled: e.target.checked
                      }
                    }
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            {loyaltySettings.redemptionOptions.giftCards.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.giftCardValue')} (SAR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.giftCards.value}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        giftCards: {
                          ...prev.redemptionOptions.giftCards,
                          value: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.pointsRequired')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.giftCards.pointsRequired}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        giftCards: {
                          ...prev.redemptionOptions.giftCards,
                          pointsRequired: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.maxUsagePerCustomer')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={loyaltySettings.redemptionOptions.giftCards.maxUsagePerCustomer}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      redemptionOptions: {
                        ...prev.redemptionOptions,
                        giftCards: {
                          ...prev.redemptionOptions.giftCards,
                          maxUsagePerCustomer: parseInt(e.target.value)
                        }
                      }
                    }))}
                  />
                </div>
              </div>
            )}
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