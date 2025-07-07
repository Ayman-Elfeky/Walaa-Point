import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Check, 
  X,
  Star,
  Zap,
  Shield,
  Users,
  BarChart3,
  Mail,
  Smartphone,
  Globe,
  CreditCard,
  Calendar,
  ArrowUpRight,
  Download,
  TrendingUp,
  Gift,
  Target
} from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { formatCurrency, formatDate, formatNumber } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Subscription = () => {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [billingHistory, setBillingHistory] = useState([]);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subData, historyData, usageData] = await Promise.all([
        subscriptionService.getCurrentPlan(),
        subscriptionService.getBillingHistory(),
        subscriptionService.getUsageStats()
      ]);
      
      // Handle API response structure
      setSubscription(subData?.subscription || {});
      setBillingHistory(historyData?.billingHistory || []);
      setUsage(usageData?.usage || {});
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setSubscription({});
      setBillingHistory([]);
      setUsage({});
      toast.error('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 49,
      description: 'Perfect for small businesses starting their loyalty journey',
      features: [
        { name: 'Up to 500 customers', included: true },
        { name: 'Up to 5 rewards', included: true },
        { name: 'Basic analytics', included: true },
        { name: 'Email support', included: true },
        { name: 'Phone support', included: false },
        { name: 'Custom branding', included: false },
        { name: 'API access', included: false },
        { name: 'Multi-location', included: false }
      ],
      popular: false
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 99,
      description: 'Great for growing businesses with more customers',
      features: [
        { name: 'Up to 2,000 customers', included: true },
        { name: 'Up to 20 rewards', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Email support', included: true },
        { name: 'Phone support', included: true },
        { name: 'Custom branding', included: false },
        { name: 'API access', included: false },
        { name: 'Multi-location', included: false }
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 199,
      description: 'Best for established businesses with high customer volume',
      features: [
        { name: 'Up to 5,000 customers', included: true },
        { name: 'Up to 50 rewards', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Email support', included: true },
        { name: 'Phone support', included: true },
        { name: 'Custom branding', included: true },
        { name: 'API access', included: true },
        { name: 'Multi-location', included: true }
      ],
      popular: true
    }
  ];

  const handleUpgrade = async (planId) => {
    try {
      setLoading(true);
      await subscriptionService.upgradePlan(planId);
      toast.success('Plan upgraded successfully!');
      fetchSubscriptionData();
    } catch (error) {
      toast.error('Failed to upgrade plan');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used, limit) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-gray-100">
            {t('subscription.subscriptionManagement')}
          </h1>
          <p className="text-secondary-600 dark:text-gray-300 mt-1">
            {t('subscription.manageSubscriptionBilling')}
          </p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button className="btn btn-outline">
            <Download className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('subscription.downloadInvoice')}
          </button>
        </div>
      </div>

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4 rtl:mr-0 rtl:ml-4">
              <Crown className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-gray-100">
                {subscription?.plan ? 
                  subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) 
                  : 'Loading...'} {t('subscription.currentPlan')}
              </h2>
              <p className="text-secondary-600 dark:text-gray-300">
                {t('subscription.nextBilling')}: {subscription?.nextBilling ? formatDate(subscription.nextBilling) : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-secondary-900 dark:text-gray-100">
              {subscription?.price ? formatCurrency(subscription.price) : '$0'}
              <span className="text-sm font-normal text-secondary-600 dark:text-gray-300">{t('subscription.perMonth')}</span>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              subscription?.status === 'active' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
            }`}>
              {subscription?.status ? 
                subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)
                : 'Loading'}
            </span>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {usage && Object.entries(usage).map(([key, data]) => {
            const percentage = getUsagePercentage(data?.used || 0, data?.limit || 1);
            const colorClass = getUsageColor(percentage);
            
            // Get localized key name
            const getKeyTranslation = (key) => {
              switch(key) {
                case 'apiCalls': return t('subscription.apiCalls');
                case 'emails': return t('subscription.emails');
                case 'storage': return t('subscription.storage');
                case 'customers': return t('navigation.customers');
                case 'rewards': return t('navigation.rewards');
                default: return key;
              }
            };
            
            return (
              <div key={key} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colorClass}`}>
                    <span className="text-lg font-bold">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </div>
                <h3 className="font-medium text-secondary-900 dark:text-gray-100 capitalize">
                  {getKeyTranslation(key)}
                </h3>
                <p className="text-sm text-secondary-600 dark:text-gray-300">
                  {formatNumber(data?.used || 0)} / {formatNumber(data?.limit || 0)}
                </p>
                <div className="w-full bg-secondary-200 rounded-full h-1.5 mt-2">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      percentage >= 90 ? 'bg-red-500' : percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-gray-100 mb-6">{t('subscription.availablePlans')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`card relative ${
                plan.popular ? 'ring-2 ring-primary-500' : ''
              } ${subscription?.plan === plan.id ? 'bg-primary-50 border-primary-200' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {t('subscription.mostPopular')}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-gray-100 mb-2">
                  {plan.name}
                </h3>
                <div className="text-3xl font-bold text-secondary-900 dark:text-gray-100 mb-1">
                  {formatCurrency(plan.price)}
                  <span className="text-sm font-normal text-secondary-600 dark:text-gray-300">{t('subscription.perMonth')}</span>
                </div>
                <p className="text-sm text-secondary-600 dark:text-gray-300">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500 mr-3 rtl:mr-0 rtl:ml-3 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-secondary-400 mr-3 rtl:mr-0 rtl:ml-3 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${
                      feature.included ? 'text-secondary-900 dark:text-gray-100' : 'text-secondary-500 dark:text-gray-400'
                    }`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={subscription?.plan === plan.id || loading}
                className={`w-full btn ${
                  subscription?.plan === plan.id
                    ? 'btn-outline cursor-not-allowed'
                    : plan.popular
                    ? 'btn-primary'
                    : 'btn-outline'
                }`}
              >
                {subscription?.plan === plan.id ? t('subscription.currentPlan') : t('subscription.upgradeNow')}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 dark:text-gray-100">{t('subscription.billingHistory')}</h2>
          <button className="btn btn-outline text-sm">
            <Download className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('common.export')} {t('common.all')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('common.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('subscription.currentPlan')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('subscription.amount')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('subscription.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('subscription.invoice')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-secondary-200 dark:divide-gray-700">
              {billingHistory.map((bill) => (
                <tr key={bill.id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {formatDate(bill.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                    {bill.plan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                    {formatCurrency(bill.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bill?.status === 'paid' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {bill?.status ? 
                        bill.status.charAt(0).toUpperCase() + bill.status.slice(1)
                        : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                    {bill.invoice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-primary-600 hover:text-primary-700">
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Usage Trends</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-3 rtl:mr-0 rtl:ml-3" />
                <span className="text-secondary-900">Customer Growth</span>
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                <span className="font-medium">+12.5%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center">
                <Gift className="h-5 w-5 text-purple-500 mr-3 rtl:mr-0 rtl:ml-3" />
                <span className="text-secondary-900">Reward Redemptions</span>
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                <span className="font-medium">+8.3%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-green-500 mr-3 rtl:mr-0 rtl:ml-3" />
                <span className="text-secondary-900">Email Usage</span>
              </div>
              <div className="flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                <span className="font-medium">+15.2%</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Recommendations</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <Target className="h-5 w-5 text-blue-500 mr-3 rtl:mr-0 rtl:ml-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Optimize Email Usage</h4>
                  <p className="text-sm text-blue-700">
                    You're using 32% of your email quota. Consider segmenting campaigns for better efficiency.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <Zap className="h-5 w-5 text-green-500 mr-3 rtl:mr-0 rtl:ml-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">API Performance</h4>
                  <p className="text-sm text-green-700">
                    Your API usage is well within limits. Great job optimizing your integration!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Subscription; 