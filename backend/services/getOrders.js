const sallaSDK = require('./sallaSDK');

const getOrders = async (accessToken, options = {}) => {
    console.log(`🔍 Fetching orders with SDK...`);
    try {
        // Set default options
        const defaultOptions = {
            limit: 50,
            page: 1,
            date_from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
            ...options
        };

        const salla = new sallaSDK();
        const data = await salla.getOrders(accessToken, defaultOptions);
        
        console.log(`✅ Fetched ${data.data?.length || 0} orders`);
        return data.data || [];
    } catch (err) {
        console.error(`❌ Error in getOrders:`, err.message);
        return []; // fallback to empty list
    }
}

// getOrders('ory_at_ThLKelVmkDrE-sZEauzujJAc7QA6_WB7uT6iYgjZKEo.jxo6QKheYmjEz6NEVluSvREWxAVFx3UvdT-pS7P-eqc')
//     .then(orders => {
//         console.log('\nOrders:', orders, '\n');
//     })
//     .catch(err => {
//         console.error('\nError fetching orders:', err, '\n');
//     });

module.exports = getOrders;
