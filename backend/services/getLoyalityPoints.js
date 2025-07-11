const getLoyaltyPoints = async (accessToken, customerId) => {
    console.log(`\nFetching loyalty points for customer ${customerId}...\n`);
    try {
        const url = `https://api.salla.dev/admin/v2/customers/loyalty/points?customer_id=${customerId}`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch loyalty points for customer ${customerId}`);
        }

        const data = await res.json();
        console.log('\nFetched Loyalty Points: ', data, '\n');
        return data.data || [];
    } catch (err) {
        console.error(`Error in getLoyaltyPoints for customer ${customerId}:`, err.message);
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