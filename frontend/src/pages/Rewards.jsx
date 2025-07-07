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
  TrendingUp
} from 'lucide-react';
import { rewardService } from '../services/rewardService';
import { formatNumber, formatCurrency, formatDate } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Rewards = () => {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const response = await rewardService.getRewards();
      setRewards(response.data || []);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setRewards([]);
      toast.error('Failed to fetch rewards');
    } finally {
      setLoading(false);
    }
  };

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
        return 'Free';
      case 'free_product':
        return 'Free Item';
      default:
        return value;
    }
  };

  const handleToggleStatus = async (rewardId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      await rewardService.updateReward(rewardId, { status: newStatus });
      toast.success('Reward status updated');
      fetchRewards();
    } catch (error) {
      toast.error('Failed to update reward status');
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
          <h1 className="text-2xl font-bold text-secondary-900">
            {t('rewards.title')}
          </h1>
          <p className="text-secondary-600 mt-1">
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
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">{t('rewards.title')}</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {formatNumber(rewards.length)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Gift className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">{t('common.active')} {t('rewards.title')}</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {formatNumber(rewards.filter(r => r.status === 'active').length)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">{t('rewards.redemptions')}</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {formatNumber(rewards.reduce((acc, r) => acc + r.usageCount, 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-600">{t('rewards.pointsRequired')}</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {formatNumber(Math.round(rewards.reduce((acc, r) => acc + r.pointsRequired, 0) / rewards.length))}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder={t('rewards.searchRewards')}
                className="input pl-10 rtl:pl-3 rtl:pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            className="input w-full sm:w-auto"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">{t('rewards.allTypes')}</option>
            <option value="percentage">{t('rewards.percentage')}</option>
            <option value="fixed">{t('rewards.fixed')}</option>
            <option value="shipping">{t('rewards.shipping')}</option>
            <option value="product">{t('rewards.product')}</option>
            <option value="cashback">{t('rewards.cashback')}</option>
          </select>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward, index) => {
          const RewardIcon = getRewardIcon(reward.type);
          const usagePercentage = (reward.usageCount / reward.maxUsage) * 100;

          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-lg transition-shadow"
            >
              {/* Reward Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getRewardTypeColor(reward.type)}`}>
                    <RewardIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">
                      {reward.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reward.status)}`}>
                      {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                    </span>
                  </div>
                </div>
                <button className="text-secondary-400 hover:text-secondary-600">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Reward Description */}
              <p className="text-sm text-secondary-600 mb-4">
                {reward.description}
              </p>

              {/* Reward Value & Points */}
              <div className="bg-secondary-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-secondary-700">Reward Value</span>
                  <span className="text-lg font-bold text-primary-600">
                    {formatRewardValue(reward.type, reward.value)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">Points Required</span>
                  <span className="text-lg font-bold text-secondary-900">
                    {formatNumber(reward.pointsRequired)}
                  </span>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-secondary-600">Usage</span>
                  <span className="text-sm font-medium text-secondary-900">
                    {formatNumber(reward.usageCount)} / {formatNumber(reward.maxUsage)}
                  </span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Reward Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-secondary-600">
                  <Calendar className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                  Valid until {formatDate(reward.validUntil, 'MMM dd, yyyy')}
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
                  {reward.status === 'active' ? 'Disable' : 'Activate'}
                </button>
                <button className="btn btn-outline text-xs py-2">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="btn text-red-600 hover:bg-red-50 text-xs py-2">
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
          <Gift className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            No rewards found
          </h3>
          <p className="text-secondary-500 mb-6">
            Create your first reward to start engaging customers.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
            Create First Reward
          </button>
        </div>
      )}
    </div>
  );
};

export default Rewards; 