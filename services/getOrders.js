const getOrders = async (accessToken) => {
    console.log(`\nFetching orders...\n`);
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
        const url = `https://api.salla.dev/admin/v2/orders?date_from=${since}`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch orders`);
        }

        const data = await res.json();
        console.log('\nFetched Orders: ', data, '\n');
        return data.data || [];
    } catch (err) {
        console.error(`Error in getOrders:`, err.message);
        return []; // fallback to empty list
    }
}

// getOrders('ory_at_t8ADUGaU2kuJJwgh5PwdfNTaouOt-0dsynva2q390zI.HhvgFM_SKtQfxuvItqJXjBuFoPzahfo9S2l0vk08pFk')
//     .then(orders => {
//         console.log('\nOrders:', orders, '\n');
//     })
//     .catch(err => {
//         console.error('\nError fetching orders:', err, '\n');
//     });

module.exports = getOrders;
