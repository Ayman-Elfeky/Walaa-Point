import api from './api';

export const analyticsService = {
  // Get dashboard overview metrics
  getDashboardMetrics: async (period = '30days') => {
    const response = await api.get('/analytics/dashboard', {
      params: { period }
    });
    return response.data;
  },

  // Get customer participation analytics
  getCustomerParticipation: async (period = '30days') => {
    const response = await api.get('/analytics/customer-participation', {
      params: { period }
    });
    return response.data;
  },

  // Get points analytics
  getPointsAnalytics: async (period = '30days') => {
    const response = await api.get('/analytics/points', {
      params: { period }
    });
    return response.data;
  },

  // Get reward performance analytics
  getRewardPerformance: async (period = '30days') => {
    const response = await api.get('/analytics/rewards', {
      params: { period }
    });
    return response.data;
  },

  // Get customer growth analytics
  getCustomerGrowth: async (period = '1year') => {
    const response = await api.get('/analytics/customer-growth', {
      params: { period }
    });
    return response.data;
  },

  // Get engagement levels
  getEngagementLevels: async (period = '30days') => {
    const response = await api.get('/analytics/engagement', {
      params: { period }
    });
    return response.data;
  },

  // Get points flow analytics
  getPointsFlow: async (period = '30days') => {
    const response = await api.get('/analytics/points-flow', {
      params: { period }
    });
    return response.data;
  },

  // Get redemption trends
  getRedemptionTrends: async (period = '30days') => {
    const response = await api.get('/analytics/redemption-trends', {
      params: { period }
    });
    return response.data;
  },

  // Get top performing rewards
  getTopPerformingRewards: async (period = '30days', limit = 10) => {
    const response = await api.get('/analytics/top-rewards', {
      params: { period, limit }
    });
    return response.data;
  },

  // Get daily activity analytics
  getDailyActivity: async (period = '30days') => {
    const response = await api.get('/analytics/daily-activity', {
      params: { period }
    });
    return response.data;
  },

  // Get customer segmentation
  getCustomerSegmentation: async () => {
    const response = await api.get('/analytics/customer-segmentation');
    return response.data;
  },

  // Get revenue impact
  getRevenueImpact: async (period = '30days') => {
    const response = await api.get('/analytics/revenue-impact', {
      params: { period }
    });
    return response.data;
  },

  // Get retention analytics
  getRetentionAnalytics: async (period = '1year') => {
    const response = await api.get('/analytics/retention', {
      params: { period }
    });
    return response.data;
  },

  // Export analytics report
  exportReport: async (reportType, period = '30days', format = 'csv') => {
    const response = await api.get('/analytics/export', {
      params: { reportType, period, format },
      responseType: 'blob'
    });
    return response.data;
  },

  // Get real-time stats
  getRealTimeStats: async () => {
    const response = await api.get('/analytics/realtime');
    return response.data;
  },

  // Get comparison data
  getComparisonData: async (currentPeriod = '30days', previousPeriod = '30days') => {
    const response = await api.get('/analytics/comparison', {
      params: { currentPeriod, previousPeriod }
    });
    return response.data;
  }
}; 