import api from './api';

export const customerService = {
  // Get all customers with pagination and filtering
  getAllCustomers: async (params = {}) => {
    const response = await api.get('/customer', { params });
    console.log("Fetched all customers:", response);
    return response.data;
  },

  // Get customer by ID
  getCustomerById: async (customerId) => {
    const response = await api.get(`/customer/${customerId}`);
    return response.data;
  },

  // Create new customer
  createCustomer: async (customerData) => {
    const response = await api.post('/customer', customerData);
    return response.data;
  },

  // Update customer
  updateCustomer: async (customerId, customerData) => {
    const response = await api.put(`/customer/${customerId}`, customerData);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (customerId) => {
    const response = await api.delete(`/customer/${customerId}`);
    return response.data;
  },

  // Adjust customer points
  adjustPoints: async (customerId, { points, type, reason }) => {
    const response = await api.post(`/customer/${customerId}/adjust-points`, {
      points,
      type,
      reason
    });
    return response.data;
  },

  // Get customer loyalty activity
  getCustomerActivity: async (customerId, params = {}) => {
    const response = await api.get(`/customer/${customerId}/loyalty-activity`, { params });
    return response.data;
  },

  // Get recent customer activities (for dashboard)
  getRecentActivities: async (params = {}) => {
    const response = await api.get('/customer/recent-activities', { params });
    return response.data;
  },

  // Get customer summary stats
  getCustomerSummary: async () => {
    const response = await api.get('/customer/summary');
    return response.data;
  },

  // Search customers
  searchCustomers: async (query, filters = {}) => {
    const response = await api.get('/customer/search', {
      params: { query, ...filters }
    });
    return response.data;
  },

  // Export customers data
  exportCustomers: async (format = 'csv', filters = {}) => {
    const response = await api.get('/customer/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  },

  // Import customers data
  importCustomers: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/customer/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
}; 