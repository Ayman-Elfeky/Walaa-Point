const sallaSDK = require('./sallaSDK');

const getLoyaltyPoints = async (accessToken, customerId) => {
    console.log(`🔍 Fetching loyalty points for customer ${customerId} with SDK...`);
    try {
        const data = await sallaSDK.getCustomerLoyaltyPoints(accessToken, customerId);
        
        console.log(`✅ Fetched loyalty points for customer ${customerId}`);
        return data.data || [];
    } catch (err) {
        console.error(`❌ Error in getLoyaltyPoints for customer ${customerId}:`, err.message);
        return []; // fallback to empty list
    }
};

// getLoyaltyPoints('ory_at_t8ADUGaU2kuJJwgh5PwdfNTaouOt-0dsynva2q390zI.HhvgFM_SKtQfxuvItqJXjBuFoPzahfo9S2l0vk08pFk', '1016255043')
//     .then(loyaltyPoints => {
//         console.log('\nLoyalty Points:', loyaltyPoints, '\n');
//     })
//     .catch(err => {
//         console.error('\nError fetching loyalty points:', err, '\n');
//     });

module.exports = getLoyaltyPoints;