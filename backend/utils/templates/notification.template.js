module.exports.notification = (link, contentInAr, contentInEn, code = '') => {
    const htmlContent = `
        <div style="font-family:Arial, sans-serif;text-align:center;">
            <h2 style="color:#4A90E2;">loyalfy</h2>
            <h3 style="margin-top: 20px">🎉🎊</h3>
            <p>${contentInAr}</p>
            <p>${contentInEn}</p>
            <p>${link}</p>
            ${code ? `<p style="font-weight:bold;">Code: ${code}</p>` : ''}
        </div>
    `;
    return htmlContent;
};