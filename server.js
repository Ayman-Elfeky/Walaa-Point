require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
// const morgan = require('morgan');
// const helmet = require('helmet');
// const compression = require('compression');
// const rateLimit = require('express-rate-limit');

// Import routes
const merchantRoutes = require('./routes/merchant.route');
const customerRoutes = require('./routes/customer.route');
const rewardRoutes = require('./routes/reward.route');
const analyticsRoutes = require('./routes/analytics.route');
const subscriptionRoutes = require('./routes/subscription.route');
const webhookRoute = require('./routes/webhook.route');

const app = express();

// Security Middleware
// app.use(helmet()); // Security headers
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests from specified origins or no origin (e.g., Postman)
        const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'];
        
        // Allow requests with no origin (mobile apps, postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS error for origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
}));

// Rate limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// General Middleware
// app.use(morgan('dev')); // Logging
app.use(express.json()); // Body parser
// app.use(express.urlencoded({ extended: true }));
// app.use(compression()); // Compress responses
app.use(cookieParser());

// API Routes
const API_PREFIX = process.env.API_PREFIX;
app.use(`${API_PREFIX}/merchant`, merchantRoutes);
app.use(`${API_PREFIX}/customer`, customerRoutes);
app.use(`${API_PREFIX}/reward`, rewardRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/subscription`, subscriptionRoutes);

// // Health check endpoint
// app.get('/health', (req, res) => {
//     res.status(200).json({ status: 'OK', timestamp: new Date() });
// });

// // 404 Handler
// app.use((req, res) => {
//     res.status(404).json({ message: 'Route not found' });
// });

// // Error Handler
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(err.status || 500).json({
//         message: err.message || 'Internal Server Error',
//         ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//     });
// });

app.get('/', (req, res) => {
    res.send('<h1>Welcome to the Loyalty App API</h1><p>Use the API prefix <code>' + process.env.API_PREFIX + '</code> for all endpoints.</p>');
}); 
// console.log(webhookRoute)
app.use('/webhook', webhookRoute);

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    connectDB();
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});