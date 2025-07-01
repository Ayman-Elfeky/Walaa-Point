const getCustomers = async (accessToken) => {
    console.log(`\nFetching customers...\n`);
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours
        const url = `https://api.salla.dev/admin/v2/customers`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch customers`);
        }

        const data = await res.json();
        console.log('\nFetched Customers: ', data, '\n');
        return data.data || [];
    } catch (err) {
        console.error(`\nError in getCustomers:`, err.message);
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