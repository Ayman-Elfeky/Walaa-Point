const crypto = require('crypto');

async function generateCouponCode(access_token, type, amount, maximumAmount, freeShipping, startDate, expiryDate, prefix = 'SAVE', excludeSaleProducts = false, isApplyWithOffer = true) {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    console.log(`Generating coupon code: ${prefix}${suffix}`);
    const raw = JSON.stringify({
        "code": `${prefix}${suffix}`,
        "type": type,
        "amount": amount,
        "maximum_amount": maximumAmount,
        "free_shipping": freeShipping,
        "start_date": startDate,
        "expiry_date": expiryDate,
        "exclude_sale_products": excludeSaleProducts,
        "is_apply_with_offer": isApplyWithOffer
    })
    const couponObj = await fetch(`https://api.salla.dev/admin/v2/coupons`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`,
        },
        body: raw
    });
    const couponData = await couponObj.json();
    if (!couponObj.ok) {
        console.log('Error creating coupon:', couponData.error.fields);
        throw new Error(`Failed to create coupon: ${couponData}`);
    }
    return couponData;
}
    
// generateCouponCode(
//     'ory_at_k7GhIgYubx5f6909yOQOIZg0lMfvuNPy_1JKMCW1qlk.6lvqf8lA9xmiko5uiQ5qbZkRL_rih3XrY89st_zqAME',
//     'percentage',
//     10,
//     50,
//     true,
//     '2025-07-20',
//     '2025-12-12',
//     'SAVE',
//     false,
//     true
// ).then(coupon => {
//     console.log('Coupon created successfully:', coupon);
// }).catch(error => {
//     console.error('Error creating coupon:', error.message);
// });

module.exports = generateCouponCode;
