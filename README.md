# Loyalty Management System for Salla Merchants

A comprehensive loyalty program backend system built for Salla merchants, providing points-based customer rewards, coupon generation, analytics, and subscription management.
(Note: For Login, the system must be installed from a merchant in Salla)

## 🚀 Features

### Core Functionality
- **Merchant Management**: Automatic app installation handling via Salla webhooks
- **Customer Management**: Track customer points, activities, and reward redemptions
- **Loyalty Program**: Configurable point earning rules and reward systems
- **Reward Rules**: Create, edit, and manage different types of rewards
- **Coupon System**: Generate and redeem discount coupons
- **Analytics & Reporting**: Comprehensive dashboard with customer participation, points flow, and reward performance
- **Subscription Management**: Multi-tier subscription plans with feature access control

### Authentication & Security
- JWT-based authentication with secure cookie management
- Password hashing with bcrypt
- Protected routes with middleware
- Subscription-based feature access control

### Notification System
- Email notifications for points earned, rewards redeemed, and birthday wishes
- Configurable notification settings per merchant
- Support for Arabic and English content

### Webhook Integration
- Salla app installation/uninstallation handling
- Order creation tracking for automatic point allocation
- Customer login detection for birthday rewards
- Review and feedback processing

## 📋 Requirements

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Salla Partner Account
- SMTP Email Service (Hostinger or SendGrid recommended)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Loyality-App-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   # Node.js Environment
   NODE_ENV=development
   PORT=5000
   
   # Database
   MONGO_URI=mongodb://localhost:27017/loyalty-app
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   
   # Salla API
   SALLA_CLIENT_ID=your-salla-client-id
   SALLA_CLIENT_SECRET=your-salla-client-secret
   SALLA_API_BASE_URL=https://api.salla.dev
   
   # Email Configuration
   APP_EMAIL_ADDRESS=noreply@yourdomain.com
   APP_EMAIL_PASSWORD=your-email-password
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=587
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
Most endpoints require authentication via JWT token stored in HTTP-only cookies.

#### Merchant Authentication
```http
POST /api/v1/merchant/login
Content-Type: application/json

{
  "email": "merchant@example.com",
  "password": "password"
}
```

### Merchant Management

#### Get Merchant Dashboard
```http
GET /api/v1/merchant/dashboard
```

#### Get/Update Loyalty Settings
```http
GET /api/v1/merchant/LoyaltySettings
PUT /api/v1/merchant/LoyaltySettings
```

### Customer Management

#### Get All Customers
```http
GET /api/v1/customer/
```

#### Create Customer
```http
POST /api/v1/customer/
Content-Type: application/json

{
  "customerId": "cust_123",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+966501234567",
  "dateOfBirth": "1990-01-15"
}
```

#### Adjust Customer Points
```http
POST /api/v1/customer/:id/adjust-points
Content-Type: application/json

{
  "points": 100,
  "type": "add",
  "reason": "Manual adjustment for complaint resolution"
}
```

### Reward Management

#### Get All Rewards
```http
GET /api/v1/reward/
```

#### Create Reward Rule
```http
POST /api/v1/reward/
Content-Type: application/json

{
  "description": "10 SAR discount",
  "pointsRequired": 100,
  "rewardType": "discountOrderPrice",
  "rewardValue": 10,
  "expiresAt": "2024-12-31"
}
```

#### Apply Reward to Customer
```http
POST /api/v1/reward/apply
Content-Type: application/json

{
  "customerId": "cust_123",
  "rewardType": "discountOrderPrice"
}
```

#### Redeem Coupon
```http
POST /api/v1/reward/redeem
Content-Type: application/json

{
  "code": "DISC123456",
  "orderId": "order_789"
}
```

### Analytics

#### Dashboard Analytics
```http
GET /api/v1/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31
```

#### Customer Participation Analytics
```http
GET /api/v1/analytics/customer-participation?period=30d
```

#### Points Analytics
```http
GET /api/v1/analytics/points?period=30d
```

#### Reward Performance
```http
GET /api/v1/analytics/rewards?period=30d
```

### Subscription Management

#### Get Subscription Info
```http
GET /api/v1/subscription/info
```

#### Get Available Plans
```http
GET /api/v1/subscription/plans
```

#### Check Feature Access
```http
POST /api/v1/subscription/check-feature
Content-Type: application/json

{
  "feature": "analytics_advanced"
}
```

### Webhooks

#### Webhook Endpoint
```http
POST /webhook
Content-Type: application/json

{
  "event": "app.installed",
  "data": {
    // Salla webhook payload
  }
}
```

Supported webhook events:
- `app.installed` - App installation
- `app.uninstalled` - App uninstallation
- `app.store.authorize` - Store authorization
- `order.created` - New order processing
- `customer.login` - Customer login (birthday check)
- `review.added` - Customer product review

## 🎯 Loyalty Program Configuration

### Point Earning Rules
- **Purchase Points**: Earn points based on order value
- **Welcome Points**: First-time customer bonus
- **Birthday Points**: Annual birthday rewards
- **Review Points**: Points for product reviews
- **Referral Points**: Sharing and referral bonuses
- **Threshold Points**: Bonus for spending above certain amounts

### Reward Types
- **Discount on Order Price**: Fixed amount discount (e.g., 10 SAR off)
- **Percentage Discount**: Percentage-based discount (e.g., 10% off)
- **Free Shipping**: Shipping cost discount
- **Cashback**: Money back to customer
- **Free Product**: Complimentary product

### Notification Settings
- Points earned notifications
- Coupon generation alerts
- Birthday wishes
- Referral bonus notifications

## 📊 Subscription Plans

### Free Plan
- Up to 100 customers
- 1 reward type
- Basic points tracking
- 50 coupons per month

### Basic Plan (49 SAR/month)
- Up to 1,000 customers
- 5 reward types
- Email notifications
- 500 coupons per month
- Basic analytics (90 days)

### Premium Plan (149 SAR/month)
- Unlimited customers
- Unlimited rewards
- SMS notifications
- Unlimited coupons
- Advanced analytics (1 year)
- Custom branding
- API access

## 🔧 Middleware

### Authentication Middleware
- `protect`: Verifies JWT token and loads merchant data

### Subscription Middleware
- `requireSubscription(features)`: Checks feature access based on subscription
- `checkUsageLimits(limitType)`: Enforces usage limits per plan
- `refreshSubscriptionData`: Updates subscription data from Salla

## 📁 Project Structure

```
Loyality-App-Backend/
├── config/
│   ├── crypto.js          # Password generation utilities
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── analytics.controller.js
│   ├── customer.controller.js
│   ├── merchant.controller.js
│   ├── notification.controller.js
│   ├── redeemCoupon.controller.js
│   ├── reward.controller.js
│   ├── subscription.controller.js
│   └── webhook.controller.js
├── middlewares/
│   ├── protect.js         # Authentication middleware
│   └── subscription.js   # Subscription management
├── models/
│   ├── coupon.model.js
│   ├── customer.model.js
│   ├── customerLoyalityActivitySchema.model.js
│   ├── merchant.model.js
│   ├── reward.model.js
│   └── transaction.model.js
├── routes/
│   ├── analytics.route.js
│   ├── customer.route.js
│   ├── merchant.route.js
│   ├── reward.route.js
│   ├── subscription.route.js
│   └── webhook.route.js
├── services/
│   ├── loyalityEngine.js  # Core loyalty logic
│   ├── getCustomers.js
│   ├── getOrders.js
│   └── refreshAccessToken.js
├── utils/
│   ├── generateCouponCode.js
│   ├── generateToken.js
│   ├── sendEmail.js
│   └── templates/
└── server.js
```

## 🚀 Deployment

### Production Setup

1. **Server Configuration**
   ```bash
   # Install PM2 for process management
   npm install -g pm2
   
   # Start application
   pm2 start server.js --name loyalty-app
   ```

2. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **SSL Setup with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Email: support@yourdomain.com
- Documentation: [API Docs](https://yourdomain.com/docs)
- Issues: [GitHub Issues](https://github.com/Loyality-program-backend/issues)

---

Built with ❤️ for Salla merchants 
