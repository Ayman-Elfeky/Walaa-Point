import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Star,
  Gift,
  Calendar,
  Phone,
  Mail,
  MoreVertical,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { formatNumber, formatDate, formatCurrency } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';
import * as settingsService from '../services/settingsService';
import { calculateTier } from '../utils/tierCalculation';

const Customers = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: ''
  });
  const [pointsForm, setPointsForm] = useState({
    points: '',
    type: 'add',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // State for tier thresholds
  const [tierThresholds, setTierThresholds] = useState({
    tierBronze: 0,
    tierSilver: 1000,
    tierGold: 5000,
    tierPlatinum: 15000
  });

  useEffect(() => {
    fetchCustomers();
    fetchTierThresholds();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAllCustomers();
      console.log('response: ', response)
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tier thresholds from loyalty settings
  const fetchTierThresholds = async () => {
    try {
      const response = await settingsService.getLoyaltySettings();
      if (response.success && response.loyaltySettings) {
        setTierThresholds({
          tierBronze: response.loyaltySettings.tierBronze || 0,
          tierSilver: response.loyaltySettings.tierSilver || 1000,
          tierGold: response.loyaltySettings.tierGold || 5000,
          tierPlatinum: response.loyaltySettings.tierPlatinum || 15000
        });
      }
    } catch (error) {
      console.error('Error fetching tier thresholds:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const customerName = customer.name || 'Unknown';
    const customerEmail = customer.email || '';
    const customerPhone = customer.phone || '';

    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerPhone.includes(searchTerm);

    const customerStatus = customer.status || 'active'; // Default to active if status not set
    const matchesFilter = filterStatus === 'all' || customerStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'text-amber-600 bg-amber-100',
      silver: 'text-gray-600 bg-gray-100',
      gold: 'text-yellow-600 bg-yellow-100',
      platinum: 'text-purple-600 bg-purple-100'
    };
    return colors[tier] || 'text-gray-600 bg-gray-100';
  };

  const openPointsModal = (customer) => {
    setSelectedCustomer(customer);
    setPointsForm({ points: '', type: 'add', reason: '' });
    setShowPointsModal(true);
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      birthday: customer.dateOfBirth ? new Date(customer.dateOfBirth).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !pointsForm.points) return;

    try {
      setSubmitting(true);
      await customerService.adjustPoints(selectedCustomer._id || selectedCustomer.id, {
        points: parseInt(pointsForm.points),
        type: pointsForm.type,
        reason: pointsForm.reason || 'Manual adjustment'
      });
      toast.success(t('customers.pointsAdjusted'));
      setShowPointsModal(false);
      setPointsForm({ points: '', type: 'add', reason: '' });
      fetchCustomers();
    } catch (error) {
      toast.error(t('customers.adjustPointsError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      setSubmitting(true);
      await customerService.updateCustomer(selectedCustomer._id || selectedCustomer.id, {
        ...customerForm,
        dateOfBirth: customerForm.birthday ? new Date(customerForm.birthday) : null
      });
      toast.success(t('customers.customerUpdated'));
      setShowEditModal(false);
      fetchCustomers();
    } catch (error) {
      toast.error(t('customers.updateCustomerError') || 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await customerService.createCustomer(customerForm);
      toast.success(t('customers.customerCreated'));
      setShowAddModal(false);
      setCustomerForm({ name: '', email: '', phone: '', birthday: '' });
      fetchCustomers();
    } catch (error) {
      toast.error(t('customers.createCustomerError') || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Export customers to CSV
  const handleExportCustomers = () => {
    try {
      const csvHeaders = [
        t('common.name'),
        t('common.email'),
        t('common.phone'),
        t('customers.points'),
        t('customers.tier'),
        t('customers.totalSpent'),
        t('customers.orders'),
        t('customers.joinDate')
      ];

      const csvData = filteredCustomers.map(customer => {
        const customerPoints = customer.points || 0;
        const customerTier = calculateTier(customerPoints, tierThresholds);
        return [
          customer.name || 'Unknown Customer',
          customer.email || '',
          customer.phone || '',
          customerPoints,
          t(`customers.${customerTier.toLowerCase()}`),
          customer.totalSpent || 0,
          customer.orders || 0,
          customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''
        ];
      });

      // Convert to CSV format with proper escaping for Arabic text
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row =>
          row.map(field => {
            // Properly escape fields containing commas, quotes, or Arabic text
            const fieldStr = String(field).replace(/"/g, '""');
            return `"${fieldStr}"`;
          }).join(',')
        )
      ].join('\n');

      // Add UTF-8 BOM for proper Arabic character display
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create blob with proper UTF-8 encoding
      const blob = new Blob([csvWithBOM], {
        type: 'text/csv;charset=utf-8;'
      });

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('customers.exportSuccess') || 'Customers exported successfully!');
    } catch (error) {
      console.error('Error exporting customers:', error);
      toast.error(t('customers.exportError') || 'Failed to export customers');
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
            {t('customers.title')}
          </h1>
          <p className="text-secondary-600 dark:text-gray-400 mt-1">
            {t('customers.manageCustomers')} ({formatNumber(customers.length)} {t('common.total')})
          </p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => handleExportCustomers()}
            className="btn btn-outline"
          >
            <Download className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('common.export')}
          </button>
          {/* <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <UserPlus className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('customers.addCustomer')}
          </button> */}
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
              <p className="text-sm font-medium text-secondary-600 dark:text-gray-400">{t('customers.title')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100 mt-1">
                {formatNumber(customers.length)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
              <p className="text-sm font-medium text-secondary-600 dark:text-gray-400">{t('customers.activeCustomers')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100 mt-1">
                {formatNumber(customers.filter(c => (c.status || 'active') === 'active').length)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
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
              <p className="text-sm font-medium text-secondary-600 dark:text-gray-400">{t('customers.totalPoints')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100 mt-1">
                {formatNumber(customers.reduce((sum, customer) => sum + (customer.points || 0), 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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
              <p className="text-sm font-medium text-secondary-600 dark:text-gray-400">{t('customers.averagePoints')}</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-gray-100 mt-1">
                {formatNumber(customers.length > 0 ? customers.reduce((sum, customer) => sum + (customer.points || 0), 0) / customers.length : 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                placeholder={t('customers.searchCustomers')}
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="input w-auto min-w-[140px] cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t('customers.allStatus')}</option>
            <option value="active">{t('customers.active')}</option>
            <option value="inactive">{t('customers.inactive')}</option>
          </select>
        </div>
      </motion.div>

      {/* Customers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-smooth border border-secondary-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredCustomers.map((customer, index) => {
            const customerAvatar = customer.avatar || '';
            const customerName = customer.name || 'Unknown Customer';
            const customerEmail = customer.email || 'No email';
            const customerPhone = `${customer.metadata.mobile_code}${customer.metadata.mobile}` || 'No phone';
            const customerPoints = customer.points || 0;
            const customerTier = calculateTier(customerPoints, tierThresholds);
            const customerTotalSpent = customer.totalSpent || 0;
            const customerOrders = customer.orders || 0;
            const customerJoinDate = customer.createdAt || customer.joinDate || new Date();
            const customerId = customer._id || customer.id;

            return (
              <motion.div
                key={customerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-700 rounded-lg border border-secondary-100 dark:border-gray-600 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Customer Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-700 dark:text-primary-400">
                        {customerAvatar ? (
                          <img src={customerAvatar} alt={customerName} className="w-full h-full rounded-full" />
                        ) : (
                          customerName.charAt(0).toUpperCase()
                        )}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 dark:text-gray-100">
                        {customerName}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(customerTier)} dark:bg-opacity-20`}>
                        <Star className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1" />
                        {t(`customers.${customerTier.toLowerCase()}`)}
                      </span>
                    </div>
                  </div>
                  <button className="text-secondary-400 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-gray-300">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                {/* Customer Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600 dark:text-gray-400">{t('customers.points')}</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {formatNumber(customerPoints)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600 dark:text-gray-400">{t('customers.totalSpent')}</span>
                    <span className="font-semibold text-secondary-900 dark:text-gray-100">
                      {formatCurrency(customerTotalSpent)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600 dark:text-gray-400">{t('customers.orders')}</span>
                    <span className="font-semibold text-secondary-900 dark:text-gray-100">
                      {formatNumber(customerOrders)}
                    </span>
                  </div>
                </div>

                {/* Customer Contact */}
                <div className="mt-4 pt-4 border-t border-secondary-100 dark:border-gray-600">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-secondary-600 dark:text-gray-400">
                      <Mail className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {customerEmail}
                    </div>
                    <div className="flex items-center text-sm text-secondary-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {customerPhone}
                    </div>
                    <div className="flex items-center text-sm text-secondary-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {t('customers.joined')} {formatDate(customerJoinDate, 'MMM yyyy')}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-secondary-100 dark:border-gray-600">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => openPointsModal(customer)}
                      className="flex-1 btn btn-primary text-xs py-2"
                    >
                      <Gift className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                      {t('customers.addPoints')}
                    </button>
                    <button
                      onClick={() => openEditModal(customer)}
                      className="btn btn-outline text-xs py-2"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-secondary-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 dark:text-gray-100 mb-2">
              {t('customers.noCustomersFound')}
            </h3>
            <p className="text-secondary-500 dark:text-gray-400 mb-6">
              {t('customers.startBuildingLoyalty')}
            </p>
            {/* <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <UserPlus className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
              {t('customers.addFirstCustomer')}
            </button> */}
          </div>
        )}
      </motion.div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t('customers.addCustomer')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.name')}
            </label>
            <input
              type="text"
              required
              className="input"
              value={customerForm.name}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.email')}
            </label>
            <input
              type="email"
              required
              className="input"
              value={customerForm.email}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.phone')}
            </label>
            <input
              type="tel"
              className="input"
              value={customerForm.phone}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('customers.birthday')}
            </label>
            <input
              type="date"
              className="input"
              value={customerForm.birthday}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, birthday: e.target.value }))}
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
              {submitting ? t('common.loading') : t('customers.addCustomer')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Points Modal */}
      <Modal
        isOpen={showPointsModal}
        onClose={() => setShowPointsModal(false)}
        title={t('customers.addPoints')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAdjustPoints} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('customers.points')}
            </label>
            <input
              type="number"
              required
              className="input"
              value={pointsForm.points}
              onChange={(e) => setPointsForm(prev => ({ ...prev, points: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('customers.type')}
            </label>
            <select
              className="input w-full"
              value={pointsForm.type}
              onChange={(e) => setPointsForm(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="add">{t('customers.addPoints')}</option>
              <option value="subtract">{t('customers.subtractPoints')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('customers.reason')}
            </label>
            <input
              type="text"
              className="input"
              value={pointsForm.reason}
              onChange={(e) => setPointsForm(prev => ({ ...prev, reason: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
            <button
              type="button"
              onClick={() => setShowPointsModal(false)}
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
              {submitting ? t('common.loading') : t('customers.addPoints')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('customers.editCustomer')}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleEditCustomer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.name')}
            </label>
            <input
              type="text"
              required
              className="input"
              value={customerForm.name}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.email')}
            </label>
            <input
              type="email"
              required
              className="input"
              value={customerForm.email}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.phone')}
            </label>
            <input
              type="tel"
              className="input"
              value={customerForm.phone}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('customers.birthday')}
            </label>
            <input
              type="date"
              className="input"
              value={customerForm.birthday}
              onChange={(e) => setCustomerForm(prev => ({ ...prev, birthday: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
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
              {submitting ? t('common.loading') : t('customers.editCustomer')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers; 