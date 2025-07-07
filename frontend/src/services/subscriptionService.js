import api from './api';

export const subscriptionService = {
  // Get current subscription details
  getCurrentSubscription: async () => {
    const response = await api.get('/subscription/current');
    return response.data;
  },

  // Alias for getCurrentSubscription to match frontend usage
  getCurrentPlan: async () => {
    const response = await api.get('/subscription/current');
    return response.data;
  },

  // Get all available plans
  getAvailablePlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  // Update subscription plan
  updateSubscription: async (planId, billingCycle = 'monthly') => {
    const response = await api.post('/subscription/update', {
      planId,
      billingCycle
    });
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (reason = '') => {
    const response = await api.post('/subscription/cancel', { reason });
    return response.data;
  },

  // Reactivate subscription
  reactivateSubscription: async () => {
    const response = await api.post('/subscription/reactivate');
    return response.data;
  },

  // Get usage statistics
  getUsageStatistics: async (period = '30days') => {
    const response = await api.get('/subscription/usage', {
      params: { period }
    });
    return response.data;
  },

  // Get billing history
  getBillingHistory: async (limit = 10) => {
    const response = await api.get('/subscription/billing-history', {
      params: { limit }
    });
    return response.data;
  },

  // Get next billing date
  getNextBilling: async () => {
    const response = await api.get('/subscription/next-billing');
    return response.data;
  },

  // Check feature access
  checkFeatureAccess: async (featureName) => {
    const response = await api.get(`/subscription/features/${featureName}`);
    return response.data;
  },

  // Get subscription limits
  getSubscriptionLimits: async () => {
    const response = await api.get('/subscription/limits');
    return response.data;
  },

  // Update payment method
  updatePaymentMethod: async (paymentMethodData) => {
    const response = await api.post('/subscription/payment-method', paymentMethodData);
    return response.data;
  },

  // Get payment methods
  getPaymentMethods: async () => {
    const response = await api.get('/subscription/payment-methods');
    return response.data;
  },

  // Generate invoice
  generateInvoice: async (invoiceId) => {
    const response = await api.get(`/subscription/invoice/${invoiceId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get subscription analytics
  getSubscriptionAnalytics: async (period = '1year') => {
    const response = await api.get('/subscription/analytics', {
      params: { period }
    });
    return response.data;
  },

  // Check upgrade requirements
  checkUpgradeRequirements: async (targetPlan) => {
    const response = await api.get('/subscription/upgrade-requirements', {
      params: { targetPlan }
    });
    return response.data;
  },

  // Sync Salla subscription data
  syncSallaSubscription: async () => {
    const response = await api.post('/subscription/sync-salla');
    return response.data;
  },

  // Get feature usage details
  getFeatureUsage: async (featureName, period = '30days') => {
    const response = await api.get(`/subscription/feature-usage/${featureName}`, {
      params: { period }
    });
    return response.data;
  },

  // Alias for getUsageStatistics to match frontend usage
  getUsageStats: async (period = '30days') => {
    const response = await api.get('/subscription/usage', {
      params: { period }
    });
    return response.data;
  },

  // Alias for updateSubscription to match frontend usage
  upgradePlan: async (planId, billingCycle = 'monthly') => {
    const response = await api.post('/subscription/update', {
      planId,
      billingCycle
    });
    return response.data;
  }
}; 