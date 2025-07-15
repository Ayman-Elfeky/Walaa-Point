# Salla Integration Guide

## Overview
This guide will help you set up and configure the Salla integration for your loyalty program backend.

## Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Salla Partner Account
- Salla App created in Partner Portal

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Salla API Configuration
SALLA_CLIENT_ID=your-salla-client-id
SALLA_CLIENT_SECRET=your-salla-client-secret
SALLA_API_BASE_URL=https://api.salla.dev
SALLA_ACCOUNTS_URL=https://accounts.salla.sa
SALLA_CALLBACK_URL=https://your-domain.com/webhook
SALLA_WEBHOOK_SECRET=your-webhook-secret-from-salla-dashboard
```

## Salla App Configuration

### 1. Create Salla App
1. Go to [Salla Partners Portal](https://partners.salla.sa)
2. Create a new app
3. Configure the following URLs:
   - **Callback URL**: `https://your-domain.com/webhook`
   - **Webhook URL**: `https://your-domain.com/webhook`

### 2. Get API Credentials
From your Salla app dashboard, get:
- Client ID
- Client Secret
- Webhook Secret

## Webhook Events

The integration supports the following webhook events:

### Core Events
- `app.installed` - App installation
- `app.uninstalled` - App uninstallation
- `app.store.authorize` - Store authorization
- `order.created` - New order created
- `order.updated` - Order updated
- `order.deleted` - Order deleted (with point deduction)
- `order.refunded` - Order refunded (with point deduction)
- `customer.login` - Customer login
- `customer.created` - New customer created
- `review.added` - Product review added
- `product.created` - Product created
- `product.updated` - Product updated

### Loyalty Events
- Automatic point allocation on orders
- Automatic point deduction on order deletion/refund
- Birthday point rewards
- Review point rewards
- Welcome point rewards

### Points Management
- **Point Allocation**: Points are automatically awarded when orders are created
- **Point Deduction**: Points are automatically deducted when:
  - Orders are deleted (full point deduction based on order total)
  - Orders are refunded (partial point deduction based on refund amount)
- **Smart Deduction**: Points are never deducted below zero
- **Tier Management**: Customer tiers are automatically updated after point changes
- **Activity Logging**: All point transactions are logged for audit purposes

## Security Features

### Webhook Security
- ✅ Signature verification
- ✅ Payload validation
- ✅ Request logging
- ✅ Rate limiting protection

### Token Management
- ✅ Automatic token refresh
- ✅ Secure token storage
- ✅ Token expiry handling

## API Features

### Enhanced API Client
- ✅ Official Salla SDK integration
- ✅ Error handling with retry logic
- ✅ Rate limiting with exponential backoff
- ✅ Comprehensive logging

### Supported Operations
- Get customers with pagination
- Get orders with filtering
- Get products with search
- Get customer loyalty points
- Add loyalty points
- Get store information
- Get merchant information

## Testing

### Test Webhook
```bash
# Test order creation (awards points)
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -H "x-salla-signature: sha256=your-signature" \
  -d '{
    "event": "order.created",
    "merchant": "your-merchant-id",
    "data": {
      "id": "order-123",
      "customer_id": "customer-123",
      "total": 100
    }
  }'

# Test order deletion (deducts points)
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -H "x-salla-signature: sha256=your-signature" \
  -d '{
    "event": "order.deleted",
    "merchant": "your-merchant-id",
    "data": {
      "id": "order-123",
      "customer_id": "customer-123",
      "total": 100
    }
  }'

# Test order refund (deducts points based on refund amount)
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -H "x-salla-signature: sha256=your-signature" \
  -d '{
    "event": "order.refunded",
    "merchant": "your-merchant-id",
    "data": {
      "id": "order-123",
      "customer_id": "customer-123",
      "total": 100,
      "refund_amount": 50
    }
  }'
```

### Test API Calls
```javascript
const sallaSDK = require('./services/sallaSDK');

// Get customers
const customers = await sallaSDK.getCustomers(accessToken, {
  limit: 10,
  page: 1
});

// Get orders
const orders = await sallaSDK.getOrders(accessToken, {
  limit: 10,
  status: 'completed'
});
```

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL configuration
   - Verify SSL certificate
   - Check firewall settings

2. **Token Refresh Issues**
   - Verify client credentials
   - Check token expiry dates
   - Ensure refresh token is valid

3. **API Rate Limiting**
   - Implement exponential backoff
   - Add request queuing
   - Monitor API usage

### Debug Mode
Enable debug logging:
```env
LOG_LEVEL=debug
```

## Best Practices

1. **Security**
   - Always verify webhook signatures
   - Use HTTPS for all endpoints
   - Regularly rotate secrets

2. **Performance**
   - Implement request caching
   - Use pagination for large datasets
   - Handle rate limiting gracefully

3. **Reliability**
   - Implement retry logic
   - Log all API interactions
   - Monitor webhook delivery

## Support

For issues related to:
- Salla API: [Salla Documentation](https://docs.salla.dev/)
- App Integration: Check the logs and error messages
- Webhook Issues: Verify signature and payload format 