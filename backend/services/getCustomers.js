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

        const data = await sallaSDK.getCustomers(accessToken, defaultOptions);
        
        console.log(`✅ Fetched ${data.data?.length || 0} customers`);
        return data.data || [];
    } catch (err) {
        console.error(`❌ Error in getCustomers:`, err.message);
        return []; // fallback to empty list
    }
};

// getCustomers('ory_at_t8ADUGaU2kuJJwgh5PwdfNTaouOt-0dsynva2q390zI.HhvgFM_SKtQfxuvItqJXjBuFoPzahfo9S2l0vk08pFk')
// .then(customers => {
//     console.log('\nCustomers:', customers, '\n');
// })
// .catch(err => {
//     console.error('\nError fetching customers:', err, '\n');
// });

module.exports = getCustomers;