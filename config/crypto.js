const generateSecurePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each: uppercase, lowercase, number, special char
    password += charset[26 + Math.floor(Math.random() * 26)]; // uppercase
    password += charset[Math.floor(Math.random() * 26)]; // lowercase
    password += charset[52 + Math.floor(Math.random() * 10)]; // number
    password += charset[62 + Math.floor(Math.random() * 8)]; // special

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
};

module.exports = generateSecurePassword;
