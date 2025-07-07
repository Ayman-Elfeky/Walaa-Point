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
  MoreVertical
} from 'lucide-react';
import { customerService } from '../services/customerService';
import { formatNumber, formatDate, formatCurrency } from '../utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const Customers = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAllCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
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

  const handleAdjustPoints = async (customerId, points, type) => {
    try {
      await customerService.adjustPoints(customerId, { points, type, reason: 'Manual adjustment' });
      toast.success(t('customers.pointsAdjusted'));
      fetchCustomers();
    } catch (error) {
      toast.error(t('customers.adjustPointsError'));
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

  if (loading) {
    return <LoadingSpinner fullScreen={false} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            {t('customers.title')}
          </h1>
          <p className="text-secondary-600 mt-1">
            {t('customers.manageCustomers')} ({formatNumber(customers.length)} {t('customers.total')})
          </p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <UserPlus className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('customers.addCustomer')}
          </button>
          <button className="btn btn-outline">
            <Download className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('common.export')}
          </button>
        </div>
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
                placeholder={t('customers.searchCustomers')}
                className="input pl-10 rtl:pl-3 rtl:pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            className="input w-full sm:w-auto"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">{t('customers.allStatuses')}</option>
            <option value="active">{t('common.active')}</option>
            <option value="inactive">{t('common.inactive')}</option>
          </select>
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer, index) => {
          const customerName = customer.name || 'Unknown Customer';
          const customerEmail = customer.email || 'No email';
          const customerPhone = customer.phone || 'No phone';
          const customerTier = customer.tier || 'bronze';
          const customerPoints = customer.points || 0;
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
              className="card hover:shadow-lg transition-shadow"
            >
              {/* Customer Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary-700">
                      {customerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">
                      {customerName}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(customerTier)}`}>
                      <Star className="h-3 w-3 mr-1 rtl:mr-0 rtl:ml-1" />
                      {t(`customers.${customerTier.toLowerCase()}`)}
                    </span>
                  </div>
                </div>
                <button className="text-secondary-400 hover:text-secondary-600">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              {/* Customer Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">{t('customers.points')}</span>
                  <span className="font-semibold text-primary-600">
                    {formatNumber(customerPoints)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">{t('customers.totalSpent')}</span>
                  <span className="font-semibold text-secondary-900">
                    {formatCurrency(customerTotalSpent)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600">{t('customers.orders')}</span>
                  <span className="font-semibold text-secondary-900">
                    {formatNumber(customerOrders)}
                  </span>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="mt-4 pt-4 border-t border-secondary-100">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-secondary-600">
                    <Mail className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {customerEmail}
                  </div>
                  <div className="flex items-center text-sm text-secondary-600">
                    <Phone className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {customerPhone}
                  </div>
                  <div className="flex items-center text-sm text-secondary-600">
                    <Calendar className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {t('customers.joined')} {formatDate(customerJoinDate, 'MMM yyyy')}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-secondary-100">
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={() => handleAdjustPoints(customerId, 100, 'add')}
                    className="flex-1 btn btn-primary text-xs py-2"
                  >
                    <Gift className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                    {t('customers.addPoints')}
                  </button>
                  <button className="btn btn-outline text-xs py-2">
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
          <Users className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            {t('customers.noCustomersFound')}
          </h3>
          <p className="text-secondary-500 mb-6">
            {t('customers.startBuildingLoyalty')}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            <UserPlus className="h-5 w-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('customers.addFirstCustomer')}
          </button>
        </div>
      )}

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
    </div>
  );
};

export default Customers; 