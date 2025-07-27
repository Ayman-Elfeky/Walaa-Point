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
import * as settingsService from '../services/settingsService';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [profileData, setProfileData] = useState({});

  const [loyaltySettings, setLoyaltySettings] = useState({
    // Start with minimal defaults - will be populated from API
    pointsPerCurrencyUnit: 1,
    rewardThreshold: 100,
    tierBronze: 0,
    tierSilver: 1000,
    tierGold: 5000,
    tierPlatinum: 15000,
    
    // Event-based settings - these match backend structure
    purchasePoints: { enabled: false, points: 0 },
    welcomePoints: { enabled: false, points: 0 },
    birthdayPoints: { enabled: false, points: 0 },
    ratingProductPoints: { enabled: false, points: 0 },
    feedbackShippingPoints: { enabled: false, points: 0 },
    shareReferralPoints: { enabled: false, points: 0 },
    profileCompletionPoints: { enabled: false, points: 0 },
    repeatPurchasePoints: { enabled: false, points: 0 },
    installAppPoints: { enabled: false, points: 0 },
    
    // Threshold-based settings
    purchaseAmountThresholdPoints: {
      enabled: false,
      thresholdAmount: 500,
      points: 0
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

  // Coupon/Reward States
  const [rewards, setRewards] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [fieldsTouched, setFieldsTouched] = useState({});
  const [rewardForm, setRewardForm] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: '',
    rewardType: 'percentage',
    rewardValue: 10,
    pointsRequired: 100,
    minOrderValue: 0,
    maxUsagePerCustomer: 1,
    maxTotalUsage: 1000,
    validUntil: '',
    category: 'general',
    terms: [''],
    termsEn: ['']
  });

  const tabs = [
    { id: 'profile', name: t('settings.profile'), icon: User },
    { id: 'loyalty', name: t('settings.loyalty'), icon: SettingsIcon },
    { id: 'coupons', name: t('settings.coupons'), icon: Gift },
    { id: 'notifications', name: t('settings.notifications'), icon: Bell },
    { id: 'appearance', name: t('settings.appearance'), icon: Palette },
    { id: 'security', name: t('settings.security'), icon: Shield }
  ];

  // Fetch loyalty settings from backend on component mount
  useEffect(() => {
    const getUserInfoFromLocalStorage = () => {
      const user = localStorage.getItem("user");
      console.log(typeof user)
      setProfileData(JSON.parse(user))
    }

    const fetchLoyaltySettings = async () => {
      try {
        const response = await settingsService.getLoyaltySettings();
        if (response.success && response.loyaltySettings) {
          console.log('🔍 Fetched loyalty settings from API:', response.loyaltySettings);
          // Replace state completely with API data, keeping structure consistent
          const apiSettings = response.loyaltySettings;
          setLoyaltySettings({
            // Core settings
            pointsPerCurrencyUnit: apiSettings.pointsPerCurrencyUnit || 1,
            rewardThreshold: apiSettings.rewardThreshold || 100,
            
            // Tier thresholds
            tierBronze: apiSettings.tierBronze || 0,
            tierSilver: apiSettings.tierSilver || 1000,
            tierGold: apiSettings.tierGold || 5000,
            tierPlatinum: apiSettings.tierPlatinum || 15000,
            
            // Event-based settings with proper structure
            purchasePoints: apiSettings.purchasePoints || { enabled: false, points: 0 },
            welcomePoints: apiSettings.welcomePoints || { enabled: false, points: 0 },
            birthdayPoints: apiSettings.birthdayPoints || { enabled: false, points: 0 },
            ratingProductPoints: apiSettings.ratingProductPoints || { enabled: false, points: 0 },
            feedbackShippingPoints: apiSettings.feedbackShippingPoints || { enabled: false, points: 0 },
            shareReferralPoints: apiSettings.shareReferralPoints || { enabled: false, points: 0 },
            profileCompletionPoints: apiSettings.profileCompletionPoints || { enabled: false, points: 0 },
            repeatPurchasePoints: apiSettings.repeatPurchasePoints || { enabled: false, points: 0 },
            installAppPoints: apiSettings.installAppPoints || { enabled: false, points: 0 },
            
            // Threshold-based settings
            purchaseAmountThresholdPoints: apiSettings.purchaseAmountThresholdPoints || {
              enabled: false,
              thresholdAmount: 500,
              points: 0
            }
          });
        } else {
          console.warn('No loyalty settings received from API');
        }
      } catch (error) {
        console.error('Error fetching loyalty settings:', error);
      }
    };

    getUserInfoFromLocalStorage()
    fetchLoyaltySettings();
    if (activeTab === 'coupons') {
      fetchRewards();
      fetchCoupons();
    }
  }, [activeTab]);

  // Fetch rewards and coupons for coupon settings
  const fetchRewards = async () => {
    try {
      const response = await settingsService.getRewards();
      if (response.success && response.rewards) {
        setRewards(response.rewards);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await settingsService.getCoupons();
      if (response.success && response.coupons) {
        setCoupons(response.coupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const handleSave = async (section) => {
    try {
      setLoading(true);
      
      if (section === 'loyalty') {
        await settingsService.updateLoyaltySettings(loyaltySettings);
        toast.success(t('settings.loyaltySettingsUpdated'));
      } else if (section === 'notifications') {
        await settingsService.updateNotificationSettings(notifications);
        toast.success(t('settings.notificationSettingsUpdated'));
      } else if (section === 'profile') {
        await settingsService.updateProfileSettings(profileData);
        toast.success(t('settings.profileUpdated') || 'Profile updated successfully!');
      } else if (section === 'appearance') {
        await settingsService.updateAppearanceSettings(appearance);
        toast.success(t('settings.appearanceUpdated') || 'Appearance settings updated successfully!');
      } else if (section === 'security') {
        await settingsService.updateSecuritySettings(security);
        toast.success(t('settings.securityUpdated') || 'Security settings updated successfully!');
      } else if (section === 'coupons') {
        // Coupons are saved individually, so just show success
        toast.success(t('settings.saveCouponSettings') || 'Coupon settings updated successfully!');
      } else {
        // Fallback for any other sections
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(t('settings.settingsUpdated'));
      }
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      const errorMessage = error.response?.data?.message || t('settings.saveError') || `Failed to save ${section} settings`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    setAppearance(prev => ({ ...prev, language }));
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  };

  // Reward Management Functions
  const handleAddReward = async () => {
    try {
      setLoading(true);
      const rewardData = {
        ...rewardForm,
        terms: rewardForm.terms.filter(term => term.trim()),
        termsEn: rewardForm.termsEn.filter(term => term.trim())
      };
      await settingsService.createReward(rewardData);
      toast.success(t('settings.rewardCreated'));
      setShowAddRewardModal(false);
      resetRewardForm();
      fetchRewards();
    } catch (error) {
      console.error('Error creating reward:', error);
      toast.error(t('settings.rewardCreateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReward = async () => {
    try {
      setLoading(true);
      const rewardData = {
        ...rewardForm,
        terms: rewardForm.terms.filter(term => term.trim()),
        termsEn: rewardForm.termsEn.filter(term => term.trim())
      };
      await settingsService.updateReward(editingReward._id, rewardData);
      toast.success(t('settings.rewardUpdated'));
      setEditingReward(null);
      resetRewardForm();
      fetchRewards();
    } catch (error) {
      console.error('Error updating reward:', error);
      toast.error(t('settings.rewardUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async (rewardId) => {
    if (!window.confirm(t('settings.confirmDeleteReward'))) return;
    
    try {
      setLoading(true);
      await settingsService.deleteReward(rewardId);
      toast.success(t('settings.rewardDeleted'));
      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error(t('settings.rewardDeleteError'));
    } finally {
      setLoading(false);
    }
  };

  const resetRewardForm = () => {
    setRewardForm({
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      rewardType: 'percentage',
      rewardValue: 10,
      pointsRequired: 100,
      minOrderValue: 0,
      maxUsagePerCustomer: 1,
      maxTotalUsage: 1000,
      validUntil: '',
      category: 'general',
      terms: [''],
      termsEn: ['']
    });
    setFieldsTouched({});
  };

  const handleEditReward = (reward) => {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name || '',
      nameEn: reward.nameEn || '',
      description: reward.description || '',
      descriptionEn: reward.descriptionEn || '',
      rewardType: reward.rewardType || 'percentage',
      rewardValue: reward.rewardValue || 10,
      pointsRequired: reward.pointsRequired || 100,
      minOrderValue: reward.minOrderValue || 0,
      maxUsagePerCustomer: reward.maxUsagePerCustomer || 1,
      maxTotalUsage: reward.maxTotalUsage || 1000,
      validUntil: reward.validUntil ? new Date(reward.validUntil).toISOString().split('T')[0] : '',
      category: reward.category || 'general',
      terms: reward.terms && reward.terms.length > 0 ? reward.terms : [''],
      termsEn: reward.termsEn && reward.termsEn.length > 0 ? reward.termsEn : ['']
    });
    setShowAddRewardModal(true);
  };

  // Utility functions for reward display
  const getRewardTypeIcon = (type) => {
    const icons = {
      percentage: Percent,
      fixed: DollarSign,
      shipping: Truck,
      cashback: CreditCard,
      product: Package
    };
    const IconComponent = icons[type] || Gift;
    return <IconComponent className="h-5 w-5" />;
  };

  const getRewardTypeColor = (type) => {
    const colors = {
      percentage: 'bg-green-100 text-green-600',
      fixed: 'bg-blue-100 text-blue-600',
      shipping: 'bg-purple-100 text-purple-600',
      cashback: 'bg-pink-100 text-pink-600', 
      product: 'bg-orange-100 text-orange-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const formatRewardType = (type) => {
    const types = {
      percentage: t('settings.percentageOff'),
      fixed: t('settings.orderDiscount'),
      shipping: t('settings.freeShipping'),
      cashback: t('settings.cashback'),
      product: t('settings.freeProduct')
    };
    return types[type] || type;
  };

  const formatRewardValue = (type, value) => {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'fixed':
      case 'cashback':
        return `${value} SAR`;
      case 'shipping':
        return t('settings.free');
      case 'product':
        return t('settings.freeItem');
      default:
        return value;
    }
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
              readOnly
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
              readOnly
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
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.website')}
            </label>
            <input
              type="url"
              className="input"
              value={profileData.storeName}
              readOnly
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.address')}
            </label>
            <input
              type="text"
              className="input"
              value={profileData.storeLocation || t('settings.unavailable')}
              readOnly
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
      {/* Purchase Points Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.PurchasePointsConfiguration')}</h3>
        <div className="space-y-4">
          {/* Core Purchase Configuration - Always Visible */}
          <div className="p-4 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="mb-4">
              <h4 className="text-secondary-900 dark:text-gray-100 font-medium mb-2">{t('settings.BasePurchasePoints')}</h4>
              <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.coreSettingsForEarningPointsFromPurchases')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  {t('settings.pointsPerCurrencyUnit')}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="input"
                  value={loyaltySettings.pointsPerCurrencyUnit}
                  onChange={(e) => setLoyaltySettings(prev => ({ ...prev, pointsPerCurrencyUnit: parseInt(e.target.value) }))}
                />
                <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
                  {`${t('settings.customerEarns1PointForEvery')} ${loyaltySettings.pointsPerCurrencyUnit} ${t('settings.sarSpent')}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                  {t('settings.pointsRequiredForReward')}
                </label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={loyaltySettings.rewardThreshold}
                  onChange={(e) => setLoyaltySettings(prev => ({ ...prev, rewardThreshold: parseInt(e.target.value) }))}
                />
                <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
                  {t('settings.minimumPointsNeededToRedeemRewards')}
                </p>
              </div>
            </div>
          </div>

          {/* Bonus Purchase Points */}
          <div className="p-4 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-secondary-900 dark:text-gray-100 block font-medium">{t('settings.bonusPurchasePoints')}</span>
                <span className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.awardAdditionalFixedBonusPoints')}</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={loyaltySettings.purchasePoints?.enabled || false}
                  onChange={(e) => setLoyaltySettings(prev => ({
                    ...prev,
                    purchasePoints: { ...prev.purchasePoints, enabled: e.target.checked }
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            {loyaltySettings.purchasePoints?.enabled && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
                    {t('settings.bonusPointsPerPurchase')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input w-32"
                    value={loyaltySettings.purchasePoints?.points || 0}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      purchasePoints: { ...prev.purchasePoints, points: parseInt(e.target.value) }
                    }))}
                  />
                  <p className="text-xs text-secondary-500 dark:text-gray-400 mt-1">
                    {t('settings.additionalFixedBonusPointsAwardedWithEachPurchase')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event-Based Points Settings */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.eventBasedPointRules')}</h3>
        <div className="space-y-4">

          {/* Welcome Points */}
          <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-secondary-900 dark:text-gray-100 block font-medium">{t('settings.welcomePoints')}</span>
                  <span className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.awardPointsToNewCustomers')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={loyaltySettings.welcomePoints?.enabled || false}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      welcomePoints: { ...prev.welcomePoints, enabled: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {loyaltySettings.welcomePoints?.enabled && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                    {t('settings.welcomeBonusPoints')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input w-32"
                    value={loyaltySettings.welcomePoints?.points || 0}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      welcomePoints: { ...prev.welcomePoints, points: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Purchase Threshold Points */}
          <div className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-gray-800 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-secondary-900 dark:text-gray-100 block font-medium">{t('settings.largeOrderBonus')}</span>
                  <span className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.extraPointsForOrdersAboveThreshold')}</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={loyaltySettings.purchaseAmountThresholdPoints?.enabled || false}
                    onChange={(e) => setLoyaltySettings(prev => ({
                      ...prev,
                      purchaseAmountThresholdPoints: { ...prev.purchaseAmountThresholdPoints, enabled: e.target.checked }
                    }))}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              {loyaltySettings.purchaseAmountThresholdPoints?.enabled && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                      {t('settings.minimumOrder(SAR)')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={loyaltySettings.purchaseAmountThresholdPoints?.thresholdAmount || 0}
                      onChange={(e) => setLoyaltySettings(prev => ({
                        ...prev,
                        purchaseAmountThresholdPoints: { 
                          ...prev.purchaseAmountThresholdPoints, 
                          thresholdAmount: parseInt(e.target.value) 
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-1">
                      {t('settings.bonusPoints')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={loyaltySettings.purchaseAmountThresholdPoints?.points || 0}
                      onChange={(e) => setLoyaltySettings(prev => ({
                        ...prev,
                        purchaseAmountThresholdPoints: { 
                          ...prev.purchaseAmountThresholdPoints, 
                          points: parseInt(e.target.value) 
                        }
                      }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tier Thresholds */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.customerTierThresholds')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-gray-300 mb-2">
              {t('settings.silverTier(PointsRequired)')}
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
              {t('settings.goldTier(PointsRequired)')}
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
              {t('settings.platinumTier(PointsRequired)')}
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
          {t('settings.saveLoyaltySettings')}
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
              <option value="SAR">{t('settings.saudiriyal')} (SAR)</option>
              <option value="USD">{t('settings.usdollar')} (USD)</option>
              <option value="EUR">{t('settings.euro')} (EUR)</option>
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
              <option value="DD/MM/YYYY">{t('settings.dateFormatDDMMYYYY')}</option>
              <option value="MM/DD/YYYY">{t('settings.dateFormatMMDDYYYY')}</option>
              <option value="YYYY-MM-DD">{t('settings.dateFormatYYYYMMDD')}</option>
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

  const renderCouponsTab = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.totalRewards')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100">{rewards.length}</p>
            </div>
            <Gift className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.totalCoupons')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100">{coupons.length}</p>
            </div>
            <CreditCard className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.activeCoupons')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100">
                {coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date()).length}
              </p>
            </div>
            <Check className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 dark:text-gray-400">{t('settings.usedCoupons')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100">
                {coupons.filter(c => c.used).length}
              </p>
            </div>
            <X className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Reward Management Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100">{t('settings.rewardManagement')}</h3>
          <button
            onClick={() => {
              resetRewardForm();
              setEditingReward(null);
              setShowAddRewardModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('settings.createNewReward')}
          </button>
        </div>

        {/* Rewards List */}
        <div className="space-y-4">
          {rewards.length === 0 ? (
            <div className="text-center py-8 text-secondary-600 dark:text-gray-400">
              {t('settings.noRewardsFound')}
            </div>
          ) : (
            rewards.map((reward) => (
              <div key={reward._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={`p-2 rounded-lg ${getRewardTypeColor(reward.rewardType)}`}>
                        {getRewardTypeIcon(reward.rewardType)}
                      </div>
                      <div>
                        <h4 className="font-medium text-secondary-900 dark:text-gray-100">{reward.name}</h4>
                        <p className="text-sm text-secondary-600 dark:text-gray-400">{reward.description}</p>
                        <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2">
                          <span className="text-xs bg-secondary-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {formatRewardType(reward.rewardType)}
                          </span>
                          <span className="text-xs text-secondary-600 dark:text-gray-400">
                            {reward.pointsRequired} {t('common.points')}
                          </span>
                          <span className="text-xs text-secondary-600 dark:text-gray-400">
                            {formatRewardValue(reward.rewardType, reward.rewardValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className={`px-2 py-1 rounded-full text-xs ${reward.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {reward.isActive ? t('settings.active') : t('settings.inactive')}
                    </span>
                    <button
                      onClick={() => handleEditReward(reward)}
                      className="p-2 text-secondary-600 hover:text-secondary-900 dark:text-gray-400 dark:hover:text-gray-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReward(reward._id)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Coupon Management Section */}
      <div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-4">{t('settings.couponManagement')}</h3>
        <div className="space-y-4">
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-secondary-600 dark:text-gray-400">
              {t('settings.noCouponsFound')}
            </div>
          ) : (
            coupons.map((coupon) => (
              <div key={coupon._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-secondary-900 dark:text-gray-100">{coupon.code}</h4>
                        <p className="text-sm text-secondary-600 dark:text-gray-400">
                          {t('settings.customer')}: {coupon.customer?.name || 'N/A'}
                        </p>
                        <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2">
                          <span className="text-xs text-secondary-600 dark:text-gray-400">
                            {t('settings.expiresAt')}: {new Date(coupon.expiresAt).toLocaleDateString()}
                          </span>
                          {coupon.used && coupon.usedAt && (
                            <span className="text-xs text-secondary-600 dark:text-gray-400">
                              {t('settings.usedAt')}: {new Date(coupon.usedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      coupon.used 
                        ? 'bg-gray-100 text-gray-800' 
                        : new Date(coupon.expiresAt) > new Date()
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {coupon.used 
                        ? t('settings.used') 
                        : new Date(coupon.expiresAt) > new Date()
                          ? t('settings.active')
                          : t('settings.expired')
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modern Add/Edit Reward Modal */}
      {showAddRewardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">
                    {editingReward ? t('settings.editReward') : t('settings.createNewReward')}
                  </h3>
                  <p className="text-blue-100 mt-1">
                    {editingReward ? 'Update your reward settings' : 'Design the perfect reward for your customers'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddRewardModal(false);
                    setEditingReward(null);
                    resetRewardForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-8">
                {/* Form Status Indicator - Only show if fields have been touched */}
                {(fieldsTouched.name || fieldsTouched.description) && (
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    rewardForm.name?.trim() && rewardForm.description?.trim()
                      ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                      : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        rewardForm.name?.trim() && rewardForm.description?.trim()
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {rewardForm.name?.trim() && rewardForm.description?.trim() ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-bold">!</span>
                        )}
                      </div>
                      <div>
                        <h4 className={`font-semibold ${
                          rewardForm.name?.trim() && rewardForm.description?.trim()
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-yellow-800 dark:text-yellow-200'
                        }`}>
                          {rewardForm.name?.trim() && rewardForm.description?.trim()
                            ? '✅ Ready to Save!'
                            : '⚠️ Complete Required Fields'
                          }
                        </h4>
                        <p className={`text-sm ${
                          rewardForm.name?.trim() && rewardForm.description?.trim()
                            ? 'text-green-600 dark:text-green-300'
                            : 'text-yellow-600 dark:text-yellow-300'
                        }`}>
                          {rewardForm.name?.trim() && rewardForm.description?.trim()
                            ? 'Your reward is ready to be saved. Click the save button below.'
                            : 'Please fill in the reward name and description to enable saving.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Step 1: Choose Reward Type */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Choose Reward Type</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        type: 'percentage',
                        name: t('settings.percentageOff'),
                        description: t('settings.percentageOffDesc'),
                        icon: Percent,
                        color: 'from-green-400 to-green-600',
                        preview: `${rewardForm.rewardValue}% OFF`
                      },
                      {
                        type: 'fixed',
                        name: t('settings.orderDiscount'),
                        description: t('settings.orderDiscountDesc'),
                        icon: DollarSign,
                        color: 'from-blue-400 to-blue-600',
                        preview: `${rewardForm.rewardValue} SAR OFF`
                      },
                      {
                        type: 'shipping',
                        name: t('settings.freeShipping'),
                        description: t('settings.freeShippingDesc'),
                        icon: Truck,
                        color: 'from-purple-400 to-purple-600',
                        preview: 'FREE SHIPPING'
                      },
                      {
                        type: 'cashback',
                        name: t('settings.cashback'),
                        description: t('settings.cashbackDesc'),
                        icon: CreditCard,
                        color: 'from-pink-400 to-pink-600',
                        preview: `${rewardForm.rewardValue} SAR BACK`
                      },
                      {
                        type: 'product',
                        name: t('settings.freeProduct'),
                        description: t('settings.freeProductDesc'),
                        icon: Package,
                        color: 'from-orange-400 to-orange-600',
                        preview: 'FREE ITEM'
                      }
                    ].map((option) => {
                      const Icon = option.icon;
                      const isSelected = rewardForm.rewardType === option.type;
                      
                      return (
                        <motion.div
                          key={option.type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setRewardForm(prev => ({ ...prev, rewardType: option.type }))}
                          className={`cursor-pointer rounded-xl border-2 transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="p-6">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center mb-4`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{option.name}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{option.description}</p>
                            <div className={`text-xs font-bold py-1 px-2 rounded-full bg-gradient-to-r ${option.color} text-white inline-block`}>
                              {option.preview}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Basic Information</h4>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-4">
                         <div>
                           <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                             {t('settings.rewardName')} <span className="text-red-500">*</span>
                           </label>
                           <input
                             type="text"
                             className={`w-full px-4 py-3 rounded-lg border transition-all ${
                               fieldsTouched.name
                                 ? rewardForm.name?.trim() 
                                   ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 focus:ring-2 focus:ring-green-500' 
                                   : 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:ring-2 focus:ring-red-500'
                                 : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                             }`}
                             value={rewardForm.name}
                             onChange={(e) => {
                               setRewardForm(prev => ({ ...prev, name: e.target.value }));
                               setFieldsTouched(prev => ({ ...prev, name: true }));
                             }}
                             onBlur={() => setFieldsTouched(prev => ({ ...prev, name: true }))}
                             placeholder={t('settings.enterRewardName')}
                           />
                           {fieldsTouched.name && !rewardForm.name?.trim() && (
                             <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center">
                               <span className="mr-1">⚠️</span> This field is required
                             </p>
                           )}
                         </div>
                         <div>
                           <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                             {t('settings.rewardDescription')} <span className="text-red-500">*</span>
                           </label>
                           <textarea
                             className={`w-full px-4 py-3 rounded-lg border transition-all ${
                               fieldsTouched.description
                                 ? rewardForm.description?.trim() 
                                   ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 focus:ring-2 focus:ring-green-500' 
                                   : 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 focus:ring-2 focus:ring-red-500'
                                 : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                             }`}
                             rows="3"
                             value={rewardForm.description}
                             onChange={(e) => {
                               setRewardForm(prev => ({ ...prev, description: e.target.value }));
                               setFieldsTouched(prev => ({ ...prev, description: true }));
                             }}
                             onBlur={() => setFieldsTouched(prev => ({ ...prev, description: true }))}
                             placeholder={t('settings.enterDescription')}
                           />
                           {fieldsTouched.description && !rewardForm.description?.trim() && (
                             <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center">
                               <span className="mr-1">⚠️</span> This field is required
                             </p>
                           )}
                         </div>
                       </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('settings.rewardNameEn')}
                          </label>
                          <input
                            type="text"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={rewardForm.nameEn}
                            onChange={(e) => setRewardForm(prev => ({ ...prev, nameEn: e.target.value }))}
                            placeholder={t('settings.enterRewardName')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('settings.rewardDescriptionEn')}
                          </label>
                          <textarea
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows="3"
                            value={rewardForm.descriptionEn}
                            onChange={(e) => setRewardForm(prev => ({ ...prev, descriptionEn: e.target.value }))}
                            placeholder={t('settings.enterDescription')}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Reward Configuration - Dynamic based on type */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reward Configuration</h4>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Dynamic reward value field based on type */}
                      {rewardForm.rewardType !== 'shipping' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                         {rewardForm.rewardType === 'percentage' 
                               ? 'Discount Percentage (%)' 
                               : rewardForm.rewardType === 'fixed' 
                                 ? 'Discount Amount (SAR)'
                                 : rewardForm.rewardType === 'cashback'
                                   ? 'Cashback Amount (SAR)'
                                   : t('settings.rewardValue')
                             } *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={rewardForm.rewardType === 'percentage' ? 100 : undefined}
                              step={rewardForm.rewardType === 'percentage' ? 1 : 0.01}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                              value={rewardForm.rewardValue}
                              onChange={(e) => setRewardForm(prev => ({ ...prev, rewardValue: parseFloat(e.target.value) || 0 }))}
                              placeholder={rewardForm.rewardType === 'percentage' ? '10' : '50.00'}
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                              {rewardForm.rewardType === 'percentage' ? '%' : 'SAR'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {rewardForm.rewardType === 'percentage' && 'Enter percentage (1-100)'}
                            {rewardForm.rewardType === 'fixed' && 'Enter fixed discount amount'}
                            {rewardForm.rewardType === 'cashback' && 'Enter cashback amount'}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.pointsRequired')} *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-16"
                            value={rewardForm.pointsRequired}
                            onChange={(e) => setRewardForm(prev => ({ ...prev, pointsRequired: parseInt(e.target.value) || 1 }))}
                            placeholder="100"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                            pts
                          </span>
                        </div>
                      </div>

                      {rewardForm.rewardType !== 'shipping' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('settings.minOrderValue')}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                              value={rewardForm.minOrderValue}
                              onChange={(e) => setRewardForm(prev => ({ ...prev, minOrderValue: parseFloat(e.target.value) || 0 }))}
                              placeholder="0.00"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                              SAR
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Minimum order to apply reward</p>
                        </div>
                      )}
                    </div>

                    {/* Live Preview */}
                    <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getRewardTypeIcon(rewardForm.rewardType)}
                        </div>
                        <div>
                          <h6 className="font-semibold text-gray-900 dark:text-gray-100">Preview:</h6>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {rewardForm.name || 'Reward Name'} - {formatRewardValue(rewardForm.rewardType, rewardForm.rewardValue)} 
                            {' '}({rewardForm.pointsRequired} points required)
                            {rewardForm.minOrderValue > 0 && ` • Min order: ${rewardForm.minOrderValue} SAR`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Advanced Settings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Advanced Settings</h4>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Usage per Customer
                        </label>
                        <select
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={rewardForm.maxUsagePerCustomer}
                          onChange={(e) => setRewardForm(prev => ({ ...prev, maxUsagePerCustomer: parseInt(e.target.value) }))}
                        >
                          <option value={1}>One time only</option>
                          <option value={2}>2 times</option>
                          <option value={3}>3 times</option>
                          <option value={5}>5 times</option>
                          <option value={10}>10 times</option>
                          <option value={999}>Unlimited</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Total Usage Limit
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={rewardForm.maxTotalUsage}
                          onChange={(e) => setRewardForm(prev => ({ ...prev, maxTotalUsage: parseInt(e.target.value) || 1000 }))}
                          placeholder="1000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Valid Until
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={rewardForm.validUntil}
                          onChange={(e) => setRewardForm(prev => ({ ...prev, validUntil: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Category
                        </label>
                        <select
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={rewardForm.category}
                          onChange={(e) => setRewardForm(prev => ({ ...prev, category: e.target.value }))}
                        >
                          <option value="general">🎯 General</option>
                          <option value="seasonal">🌟 Seasonal</option>
                          <option value="special">⭐ Special</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions - Collapsible */}
                <div className="space-y-4">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-400 group-open:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors">5</div>
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Terms & Conditions</h4>
                        <span className="text-sm text-gray-500">(Optional)</span>
                      </div>
                      <Plus className="h-5 w-5 text-gray-400 group-open:rotate-45 transition-transform" />
                    </summary>
                    
                    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                      <div className="space-y-3">
                        {rewardForm.terms.map((term, index) => (
                          <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
                            <span className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <input
                              type="text"
                              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                              value={term}
                              onChange={(e) => {
                                const newTerms = [...rewardForm.terms];
                                newTerms[index] = e.target.value;
                                setRewardForm(prev => ({ ...prev, terms: newTerms }));
                              }}
                              placeholder={`Term ${index + 1}: e.g., Valid for new customers only`}
                            />
                            {rewardForm.terms.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newTerms = rewardForm.terms.filter((_, i) => i !== index);
                                  setRewardForm(prev => ({ ...prev, terms: newTerms }));
                                }}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setRewardForm(prev => ({ ...prev, terms: [...prev.terms, ''] }))}
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Term</span>
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>

                         {/* Footer Actions */}
             <div className="bg-gray-50 dark:bg-gray-800 px-8 py-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
               <div className="flex justify-end items-center">
                 <div className="flex space-x-3 rtl:space-x-reverse">
                   <button
                     onClick={() => {
                       setShowAddRewardModal(false);
                       setEditingReward(null);
                       resetRewardForm();
                     }}
                     className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
                   >
                     {t('common.cancel')}
                   </button>
                   <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={editingReward ? handleUpdateReward : handleAddReward}
                     disabled={loading}
                     className={`px-8 py-3 rounded-lg transition-all font-semibold shadow-lg flex items-center space-x-2 ${
                       loading
                         ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                         : rewardForm.name?.trim() && rewardForm.description?.trim()
                           ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-xl'
                           : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                     }`}
                     title={!rewardForm.name?.trim() || !rewardForm.description?.trim() ? 'Please fill in reward name and description to save' : 'Save your reward'}
                   >
                     {loading ? (
                       <>
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         <span>Saving...</span>
                       </>
                     ) : (
                       <>
                         <Save className="h-5 w-5" />
                         <span>{editingReward ? t('settings.updateReward') : t('settings.saveReward')}</span>
                       </>
                     )}
                   </motion.button>
                 </div>
               </div>
             </div>
          </motion.div>
        </div>
      )}
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
      case 'coupons': return renderCouponsTab();
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