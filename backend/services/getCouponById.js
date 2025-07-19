const salla = require('../services/sallaSDK');

const getCouponById = async (accessToken, couponId) => {
    console.log(`🔍 Fetching coupon with ID: ${couponId} using SDK...`);
    try {
        const data = await salla.getCouponById(accessToken, couponId);
        console.log('🎉 Coupon fetched successfully:', data);
        return data;
    } catch (error) {
        console.error('❌ Error fetching coupon:', error);
        throw error;
    }
};

// getCouponById('ory_at_k7GhIgYubx5f6909yOQOIZg0lMfvuNPy_1JKMCW1qlk.6lvqf8lA9xmiko5uiQ5qbZkRL_rih3XrY89st_zqAME', '2123913641')
//     .then(coupon => {
//         console.log('Fetched coupon:', coupon);
//     })
//     .catch(err => {
//         console.error('Error fetching coupon:', err);
//     });

module.exports = getCouponById;
