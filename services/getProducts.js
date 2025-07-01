const getProducts = async(accessToken, merchantId) => {
    console.log(`\nFetching products for merchant ${merchantId}...\n`);
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
        const url = `https://api.salla.dev/admin/v2/products?date_from=${since}`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch products for merchant ${merchantId}`);
        }

        const data = await res.json();
        console.log('\nFetched Products: ', data.data, '\n');
        return data.data || [];
    } catch (err) {
        console.error(`Error in getProducts for merchant ${merchantId}:`, err.message);
        return []; // fallback to empty list
    }
}

// // Example usage:
// getProducts('ory_at_t8ADUGaU2kuJJwgh5PwdfNTaouOt-0dsynva2q390zI.HhvgFM_SKtQfxuvItqJXjBuFoPzahfo9S2l0vk08pFk', 'merchant_id')
//     .then(products => {
//         console.log('\n\n\n\nProducts: ', products.length, '\n');
//     })
//     .catch(err => {
//         console.error('\nError fetching products:', err, '\n');
//     });

module.exports = getProducts;
