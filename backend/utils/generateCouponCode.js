const crypto = require('crypto');

function generateCouponCode(prefix = 'SAVE') {
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${suffix}`;
}

module.exports = generateCouponCode;
