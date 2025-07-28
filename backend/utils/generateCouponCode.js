const crypto = require('crypto');

async function generateCouponCode(access_token, type, amount, maximumAmount, freeShipping, startDate, expiryDate, prefix = 'SAVE', excludeSaleProducts = false, isApplyWithOffer = true) {
    console.log('Generating coupon code with parameters:');
    console.log('Type:', type);
    console.log('Amount:', amount);
    console.log('Maximum Amount:', maximumAmount);
    console.log('Free Shipping:', freeShipping);
    console.log('Start Date:', startDate);
    expiryDate = expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default to 30 days from now
    console.log('Expiry Date:', expiryDate);

    console.log('merchant access token: ', access_token);
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    console.log(`Generating coupon code: ${prefix}${suffix}`);
    const raw = JSON.stringify({
        "code": `${prefix}${suffix}`,
        "type": type,
        "amount": amount,
        "maximum_amount": maximumAmount,
        "free_shipping": freeShipping,
        "start_date": startDatee,
        "expiry_date": expiryDatee,
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
    console.log("Coupon data: ", couponData);
    return couponData;
}

// generateCouponCode(
//     'ory_at_9hVKfn8B-f5ciAHdbcf_8_Ekkias395RQjG_qG2sKSU.9g9oTCF8ar6LWXrFuuCz5npKON6QjE_jTQtFUUj7q1s',
//     'percentage',
//     10,
//     50,
//     true,
//     '2025-07-30',
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
