const sallaSDK = require('./sallaSDK');

const getCustomers = async (accessToken, options = {}) => {
    console.log(`🔍 Fetching customers with SDK...`);
    try {
        // Set default options
        const defaultOptions = {
            limit: 50,
            page: 1,
            ...options
        };

        const salla = new sallaSDK()
        const data = await salla.getCustomers(accessToken, defaultOptions);
        
        console.log(`✅ Fetched ${data.data?.length || 0} customers`);
        return data.data || [];
    } catch (err) {
        console.error(`❌ Error in getCustomers:`, err.message);
        return []; // fallback to empty list
    }
};

// getCustomers('ory_at_ThLKelVmkDrE-sZEauzujJAc7QA6_WB7uT6iYgjZKEo.jxo6QKheYmjEz6NEVluSvREWxAVFx3UvdT-pS7P-eqc')
// .then(customers => {
//     console.log('\nCustomers:', customers[0], '\n');
// })
// .catch(err => {
//     console.error('\nError fetching customers:', err, '\n');
// });

module.exports = getCustomers;