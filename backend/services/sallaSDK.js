const SallaAPIFactory = require('@salla.sa/passport-strategy');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

class SallaSDKService {
    constructor() {
        this.api = null;
        this.baseURL = 'https://api.salla.dev';
        this.accountsURL = 'https://accounts.salla.sa';
        this.initializeSDK();
    }

    initializeSDK() {
        this.api = new SallaAPIFactory({
            clientID: process.env.SALLA_CLIENT_ID,
            clientSecret: process.env.SALLA_CLIENT_SECRET,
            callbackURL: process.env.SALLA_CALLBACK_URL || 'http://localhost:3000/webhook',
        });
    }

    /**
     * Get API instance
     */
    getAPI() {
        return this.api;
    }

    /**
     * Set access token for authenticated requests
     */
    setAccessToken(accessToken, refreshToken = null, expiresIn = null, userProfile = null) {
        if (this.api) {
            this.api.setAccessToken(accessToken, refreshToken, expiresIn, userProfile);
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const response = await axios.post(`${this.accountsURL}/oauth2/token`, {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: process.env.SALLA_CLIENT_ID,
                client_secret: process.env.SALLA_CLIENT_SECRET
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            const { access_token, refresh_token, expires_in } = response.data;

            return {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresIn: expires_in,
                expiresAt: new Date(Date.now() + expires_in * 1000)
            };
        } catch (error) {
            console.error('❌ Error refreshing access token:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get merchant information
     */
    async getMerchantInfo(accessToken) {
        try {
            const response = await axios.get(`${this.baseURL}/admin/v2/oauth2/user/info`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            console.log('Merchant info from sallaSDK:', response.data);

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching merchant info:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get customers with pagination and filtering
     */
    async getCustomers(accessToken, options = {}) {
        try {
            const params = new URLSearchParams();

            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);
            if (options.search) params.append('search', options.search);
            if (options.date_from) params.append('date_from', options.date_from);
            if (options.date_to) params.append('date_to', options.date_to);

            const url = `${this.baseURL}/admin/v2/customers${params.toString() ? '?' + params.toString() : ''}`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching customers:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get customer by ID
     */
    async getCustomer(accessToken, customerId) {
        try {
            const response = await axios.get(`${this.baseURL}/admin/v2/customers/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching customer:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get orders with pagination and filtering
     */
    async getOrders(accessToken, options = {}) {
        try {
            const params = new URLSearchParams();

            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);
            if (options.status) params.append('status', options.status);
            if (options.date_from) params.append('date_from', options.date_from);
            if (options.date_to) params.append('date_to', options.date_to);

            const url = `${this.baseURL}/admin/v2/orders${params.toString() ? '?' + params.toString() : ''}`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching orders:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get order by ID
     */
    async getOrder(accessToken, orderId) {
        try {
            const response = await axios.get(`${this.baseURL}/admin/v2/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching order:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get products with pagination and filtering
     */
    async getProducts(accessToken, options = {}) {
        try {
            const params = new URLSearchParams();

            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);
            if (options.search) params.append('search', options.search);
            if (options.date_from) params.append('date_from', options.date_from);
            if (options.date_to) params.append('date_to', options.date_to);

            const url = `${this.baseURL}/admin/v2/products${params.toString() ? '?' + params.toString() : ''}`;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching products:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get customer loyalty points
     */
    async getCustomerLoyaltyPoints(accessToken, customerId) {
        try {
            const response = await axios.get(`${this.baseURL}/admin/v2/customers/${customerId}/loyalty/points`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching customer loyalty points:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Add loyalty points to customer
     */
    async addLoyaltyPoints(accessToken, customerId, points, reason = '') {
        try {
            const response = await axios.post(`${this.baseURL}/admin/v2/customers/${customerId}/loyalty/points`, {
                points: points,
                reason: reason
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error adding loyalty points:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get store information
     */
    async getStoreInfo(accessToken) {
        try {
            const response = await axios.get(`${this.baseURL}/admin/v2/store`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching store info:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Create a new coupon
     */
    // async createCoupon(accessToken, couponData) {
    //     try {
    //         const response = await axios.post(`${this.baseURL}/admin/v2/coupons`, couponData, {
    //             headers: {
    //                 'Authorization': `Bearer ${accessToken}`,
    //                 'Accept': 'application/json',
    //                 'Content-Type': 'application/json'
    //             }
    //         });

    //         return response.data;
    //     } catch (error) {
    //         console.error('❌ Error creating coupon:', error.response?.data || error.message);
    //         throw error;
    //     }
    // }

    /**
     * Get all coupons
     */
    async getCoupons(accessToken, options = {}) {
        try {
            const response = await axios.get(`${this.baseURL}/admin/v2/coupons`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                },
                // params: options
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching coupons:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get coupon by ID
     */
    async getCouponById(accessToken, couponId) {
        try {
            const response = await axios.get(`${this.baseURL}/admin/v2/coupons/${couponId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching coupon by ID:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * update coupon by ID
     */
    async updateCouponById(accessToken, couponId, couponData) {
        try {
            const response = await axios.put(`${this.baseURL}/admin/v2/coupons/${couponId}`, couponData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error updating coupon by ID:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Delete coupon by ID
     */
    async deleteCouponById(accessToken, couponId) {
        try {
            const response = await axios.delete(`${this.baseURL}/admin/v2/coupons/${couponId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        } catch (error) {
            console.error('❌ Error deleting coupon by ID:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Generic API request method
     */
    async makeRequest(accessToken, method, endpoint, data = null, options = {}) {
        try {
            const config = {
                method: method.toUpperCase(),
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
                config.data = data;
            }

            const response = await axios(config);
            return response.data;
        } catch (error) {
            console.error(`❌ Error making ${method} request to ${endpoint}:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Handle rate limiting with exponential backoff
     */
    async makeRequestWithRetry(accessToken, method, endpoint, data = null, maxRetries = 3) {
        let retries = 0;

        while (retries < maxRetries) {
            try {
                return await this.makeRequest(accessToken, method, endpoint, data);
            } catch (error) {
                if (error.response?.status === 429) {
                    const delay = Math.pow(2, retries) * 1000; // Exponential backoff
                    console.warn(`⚠️  Rate limited, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retries++;
                } else {
                    throw error;
                }
            }
        }

        throw new Error(`Max retries (${maxRetries}) exceeded`);
    }
}

// Export class instead of singleton to avoid immediate initialization
module.exports = SallaSDKService; 