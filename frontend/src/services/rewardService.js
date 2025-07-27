import api from './api';

export const rewardService = {
  // Get all rewards
  getAllRewards: async (params = {}) => {
    const response = await api.get('/reward', { params });
    return response.data;
  },

  // Alias for getAllRewards to match frontend usage
  getRewards: async (params = {}) => {
    const response = await api.get('/reward', { params });
    console.log("Aweha:",response)
    return response.data;
  },

  // Get reward by ID
  getRewardById: async (rewardId) => {
    const response = await api.get(`/reward/${rewardId}`);
    return response.data;
  },

  // Create new reward
  createReward: async (rewardData) => {
    const response = await api.post('/reward', rewardData);
    return response.data;
  },

  // Update reward
  updateReward: async (rewardId, rewardData) => {
    const response = await api.put(`/reward/${rewardId}`, rewardData);
    return response.data;
  },

  // Delete reward
  deleteReward: async (rewardId) => {
    const response = await api.delete(`/reward/${rewardId}`);
    return response.data;
  },

  // Get reward statistics
  getRewardStats: async (rewardId) => {
    const response = await api.get(`/reward/${rewardId}/stats`);
    return response.data;
  },

  // Generate coupon for customer
  generateCoupon: async (customerId, rewardId) => {
    const response = await api.post('/reward/generate-coupon', {
      customerId,
      rewardId
    });
    return response.data;
  },

  // Redeem coupon
  redeemCoupon: async (couponCode, orderId = null) => {
    const response = await api.post('/reward/redeem-coupon', {
      couponCode,
      orderId
    });
    return response.data;
  },

  // Get all coupons
  getAllCoupons: async (params = {}) => {
    const response = await api.get('/reward/coupons', { params });
    return response.data;
  },

  // Get coupon details
  getCouponDetails: async (couponCode) => {
    const response = await api.get(`/reward/coupons/${couponCode}`);
    return response.data;
  },

  // Get reward performance analytics
  getRewardPerformance: async (period = '30days') => {
    const response = await api.get('/reward/performance', {
      params: { period }
    });
    return response.data;
  },

  // Get redemption trends
  getRedemptionTrends: async (period = '30days') => {
    const response = await api.get('/reward/redemption-trends', {
      params: { period }
    });
    return response.data;
  },

  // Apply reward to customer order
  applyRewardToOrder: async (customerId, rewardId, orderData) => {
    const response = await api.post('/reward/apply-to-order', {
      customerId,
      rewardId,
      orderData
    });
    return response.data;
  },

  // Get active rewards for customer
  getActiveRewardsForCustomer: async (customerId) => {
    const response = await api.get(`/reward/customer/${customerId}/active`);
    return response.data;
  },

  // Validate coupon
  validateCoupon: async (couponCode, orderData) => {
    const response = await api.post('/reward/validate-coupon', {
      couponCode,
      orderData
    });
    return response.data;
  }
}; 