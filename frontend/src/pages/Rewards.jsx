import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Percent,
  CreditCard,
  Truck,
  DollarSign,
  Package,
  MoreVertical,
  Calendar,
  Users,
  TrendingUp,
  Star
} from 'lucide-react';
import { rewardService } from '../services/rewardService';
import { formatNumber, formatCurrency, formatDate } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Rewards = () => {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    type: 'percentage_discount',
    value: '',
    pointsRequired: '',
    expiresAt: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log("Fetching rewards...");
    fetchRewards();
  }, []);


  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await rewardService.getRewards();
      console.log("Response from the backend:", response.rewards)
      setRewards(response.rewards || []);
    } catch (error) {
      console.error('Error fetching rewards From rewards:', error);
      setRewards([]);
      toast.error(t('rewards.failedToFetchRewards'));
    } finally {
      setLoading(false);
    }
  };

  console.log("Rewards: ", rewards)

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || reward.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getRewardIcon = (type) => {
    const icons = {
      percentage_discount: Percent,
      fixed_discount: DollarSign,
      free_shipping: Truck,
      free_product: Package,
      cashback: CreditCard
    };
    return icons[type] || Gift;
  };

  const getRewardTypeColor = (type) => {
    const colors = {
      percentage_discount: 'text-green-600 bg-green-100',
      fixed_discount: 'text-blue-600 bg-blue-100',
      free_shipping: 'text-purple-600 bg-purple-100',
      free_product: 'text-orange-600 bg-orange-100',
      cashback: 'text-pink-600 bg-pink-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-600 bg-green-100',
      draft: 'text-yellow-600 bg-yellow-100',
      expired: 'text-red-600 bg-red-100',
      disabled: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const formatRewardValue = (type, value) => {
    switch (type) {
      case 'percentage_discount':
        return `${value}%`;
      case 'fixed_discount':
      case 'cashback':
        return formatCurrency(value);
      case 'free_shipping':
        return t('rewards.free');
      case 'free_product':
        return t('rewards.freeItem');
      default:
        return value;
    }
  };

  const handleToggleStatus = async (rewardId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      await rewardService.updateReward(rewardId, { status: newStatus });
      toast.success(t('rewards.rewardStatusUpdated'));
      fetchRewards();
    } catch (error) {
      toast.error(t('rewards.failedToUpdateRewardStatus'));
    }
  };

  const handleAddReward = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await rewardService.createReward(rewardForm);
      toast.success(t('rewards.rewardCreated'));
      setShowAddModal(false);
      setRewardForm({
        name: '',
        description: '',
        type: 'percentage_discount',
        value: '',
        pointsRequired: '',
        expiresAt: ''
      });
      fetchRewards();
    } catch (error) {
      toast.error(t('rewards.createRewardError') || 'Failed to create reward');
    } finally {
      setSubmitting(false);
    }
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
            {t('rewards.title')}
          </h1>
          <p className="text-secondary-600 dark:text-gray-400 mt-1">
            {t('rewards.manageRewards')} ({formatNumber(rewards.length)} {t('common.total')})
          </p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('rewards.createReward')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-smooth border border-secondary-100 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-gray-400">{t('rewards.title')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100 mt-1">
                {formatNumber(rewards.length)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Gift className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-smooth border border-secondary-100 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-gray-400">{t('rewards.activeRewards')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100 mt-1">
                {formatNumber(rewards.filter(r => r.status === 'active').length)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-smooth border border-secondary-100 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-gray-400">{t('rewards.totalRedemptions')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100 mt-1">
                {formatNumber(rewards.reduce((sum, reward) => sum + (reward.redemptions || 0), 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-smooth border border-secondary-100 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600 dark:text-gray-400">{t('rewards.avgPointsRequired')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100 mt-1">
                {formatNumber(rewards.length > 0 ? rewards.reduce((sum, reward) => sum + (reward.pointsRequired || 0), 0) / rewards.length : 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-smooth border border-secondary-100 dark:border-gray-700 p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={t('rewards.searchRewards')}
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="input w-auto min-w-[140px] cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">{t('rewards.allTypes')}</option>
            <option value="percentage_discount">{t('rewards.percentageDiscount')}</option>
            <option value="fixed_discount">{t('rewards.fixedDiscount')}</option>
            <option value="free_shipping">{t('rewards.freeShipping')}</option>
            <option value="free_product">{t('rewards.freeProduct')}</option>
            <option value="cashback">{t('rewards.cashback')}</option>
          </select>
        </div>
      </motion.div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward, index) => {
          const RewardIcon = getRewardIcon(reward.type);
          const usagePercentage = (reward.usageCount / reward.maxTotalUsage) * 100;

          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-smooth border border-secondary-100 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Reward Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRewardTypeColor(reward.type)} dark:bg-opacity-20`}>
                    <RewardIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900 dark:text-gray-100">
                      {reward.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reward.status)} dark:bg-opacity-20`}>
                      {/* {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)} */}
                    </span>
                  </div>
                </div>
                <button className="text-secondary-400 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-gray-300">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Reward Description */}
              <p className="text-sm text-secondary-600 dark:text-gray-400 mb-4">
                {reward.description}
              </p>

              {/* Reward Value & Points */}
              <div className="bg-secondary-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700 dark:text-gray-300">{t('rewards.rewardValueLabel')}</span>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {formatRewardValue(reward.type, reward.value)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700 dark:text-gray-300">{t('rewards.pointsRequired')}</span>
                  <span className="text-lg font-bold text-secondary-900 dark:text-gray-100">
                    {formatNumber(reward.pointsRequired)}
                  </span>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-secondary-600 dark:text-gray-400">{t('rewards.usage')}</span>
                  <span className="text-sm font-medium text-secondary-900 dark:text-gray-100">
                    {formatNumber(reward.maxTotalUsage)} / {formatNumber(reward.maxTotalUsage)}
                  </span>
                </div>
                <div className="w-full bg-secondary-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Reward Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-secondary-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  {t('rewards.validUntil')} {formatDate(reward.validUntil, 'MMM dd, yyyy')}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 rtl:space-x-reverse">
                <button
                  onClick={() => handleToggleStatus(reward.id, reward.status)}
                  className={`flex-1 btn text-xs py-2 ${
                    reward.status === 'active' ? 'btn-outline' : 'btn-primary'
                  }`}
                >
                  {reward.status === 'active' ? t('rewards.disable') : t('rewards.activate')}
                </button>
                <button className="btn btn-outline text-xs py-2">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="btn text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs py-2">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredRewards.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-secondary-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 dark:text-gray-100 mb-2">
            {t('rewards.noRewardsFoundEmpty')}
          </h3>
          <p className="text-secondary-500 dark:text-gray-400 mb-6">
            {t('rewards.createFirstRewardDesc')}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('rewards.createFirstRewardBtn')}
          </button>
        </div>
      )}

      {/* Add Reward Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('rewards.createReward')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddReward} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.name')}
            </label>
            <input
              type="text"
              required
              className="input"
              value={rewardForm.name}
              onChange={(e) => setRewardForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.description')}
            </label>
            <textarea
              required
              className="input"
              rows="3"
              value={rewardForm.description}
              onChange={(e) => setRewardForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('rewards.rewardType')}
            </label>
            <select
              className="input"
              value={rewardForm.type}
              onChange={(e) => setRewardForm(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="percentage_discount">{t('rewards.percentage')}</option>
              <option value="fixed_discount">{t('rewards.fixed')}</option>
              <option value="free_shipping">{t('rewards.shipping')}</option>
              <option value="free_product">{t('rewards.product')}</option>
              <option value="cashback">{t('rewards.cashback')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('rewards.rewardValue')}
            </label>
            <input
              type="number"
              required
              className="input"
              value={rewardForm.value}
              onChange={(e) => setRewardForm(prev => ({ ...prev, value: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('rewards.pointsRequired')}
            </label>
            <input
              type="number"
              required
              className="input"
              value={rewardForm.pointsRequired}
              onChange={(e) => setRewardForm(prev => ({ ...prev, pointsRequired: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('rewards.expiresAt')}
            </label>
            <input
              type="date"
              className="input"
              value={rewardForm.expiresAt}
              onChange={(e) => setRewardForm(prev => ({ ...prev, expiresAt: e.target.value }))}
            />
          </div>
          
          <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn btn-outline"
              disabled={submitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? t('common.loading') : t('rewards.createReward')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rewards; 