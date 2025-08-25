const jwt = require('jsonwebtoken');
const Merchant = require('../models/merchant.model');

const protect = async (req, res, next) => {
    const token = req.cookies.jwt; // Get JWT from cookies
    // const method = req.method;
    // const body = req.body;
    // const headers = req.headers.Authorization;
    // let token = headers.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized, no token provided' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find the merchant by ID
        const merchant = await Merchant.findById(decoded.id);
        
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        // Attach merchant to request object
        req.merchant = merchant;
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error('Token verification failed from protect middleware:', error.message);
        res.status(401).json({ message: 'Unauthorized, invalid token' });
    }
};

module.exports = protect;