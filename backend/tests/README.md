# Loyalty System Test Suite 🧪

This directory contains comprehensive tests for the loyalty system backend, including unit tests, integration tests, webhook simulation tests, and end-to-end tests.

## 📁 Test Files

### Core Test Files
- **`webhook.simulation.test.js`** - Complete webhook event simulation tests covering all Salla webhook events
- **`loyaltyEngine.integration.test.js`** - Integration tests for loyalty engine logic (points, tiers, coupon generation)
- **`webhook.e2e.test.js`** - End-to-end tests covering complete webhook flows with security validation
- **`loyaltyEngine.unit.test.js`** - Unit tests for loyalty engine components
- **`rewardController.integration.test.js`** - Integration tests for reward and coupon systems
- **`software.e2e.test.js`** - Complete software flow tests

### Helper Files
- **`test-helper.js`** - Comprehensive test utilities, mock data generators, and setup functions
- **`README.md`** - This documentation file

## 🎯 Test Coverage

### Webhook Events Tested
✅ **Order Events**
- `order.created` - Point allocation and coupon generation
- `order.updated` - Order modification handling
- `order.deleted` - Point deduction logic
- `order.refunded` - Partial/full refund point deduction

✅ **Customer Events**
- `customer.created` - Welcome points and customer registration
- `customer.login` - Birthday detection and rewards

✅ **Product Events**
- `product.created` - Product creation logging
- `product.updated` - Product modification handling

✅ **App Lifecycle Events**
- `app.store.authorize` - Merchant registration and setup
- `app.uninstalled` - Cleanup and data removal

✅ **Review & Feedback Events**
- `review.added` - Review point rewards
- `app.feedback.created` - Feedback point rewards

### Loyalty Engine Features Tested
✅ **Point Management**
- Point allocation for purchases
- Point deduction for refunds/cancellations
- Threshold-based bonus points
- Tier calculation and updates

✅ **Coupon Generation**
- Automatic coupon creation at point thresholds
- Multiple coupon generation for large purchases
- Admin notifications for missing rewards

✅ **Customer Journey**
- Welcome point rewards
- Birthday point detection
- Tier progression and regression

✅ **Security & Validation**
- Webhook signature verification
- Payload validation
- Error handling and recovery

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run All Tests
```bash
npm test
```

### 3. Run Specific Test Types
```bash
# Run only webhook tests
npm run test:webhook

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e

# Run only unit tests
npm run test:unit
```

## 🔧 Advanced Usage

### Using the Test Runner Script
The comprehensive test runner provides detailed reporting and environment setup:

```bash
# Run all tests with detailed output
node scripts/run-tests.js

# Run specific test categories
node scripts/run-tests.js --webhook
node scripts/run-tests.js --integration
node scripts/run-tests.js --e2e
node scripts/run-tests.js --unit
node scripts/run-tests.js --loyalty

# Show help
node scripts/run-tests.js --help
```

### Watch Mode for Development
```bash
npm run test:watch
```

### Individual Test Files
```bash
# Run specific test file
npx mocha tests/webhook.simulation.test.js

# Run with specific timeout
npx mocha tests/webhook.e2e.test.js --timeout 15000

# Run with detailed reporter
npx mocha tests/*.test.js --reporter json > test-results.json
```

## 🛠️ Test Configuration

### Environment Variables
The tests automatically set up the following test environment variables:
- `NODE_ENV=test`
- `SALLA_WEBHOOK_SECRET=test_webhook_secret_key_for_testing`
- `SALLA_CLIENT_ID=test_client_id`
- `SALLA_CLIENT_SECRET=test_client_secret`
- `MONGODB_URI=mongodb://localhost:27017/loyalty_test`

### Mock Data
All tests use realistic mock data that matches Salla webhook payloads:
- **Merchant Data**: Complete merchant profiles with loyalty settings
- **Customer Data**: Real customer profiles with points and tiers
- **Order Data**: Realistic order structures with amounts and currencies
- **Product Data**: Sample product information
- **Webhook Signatures**: Valid HMAC-SHA256 signatures for security testing

## 📊 Test Categories Explained

### 1. Unit Tests (`*.unit.test.js`)
- Test individual functions and components in isolation
- Fast execution, no external dependencies
- Focus on specific logic validation

### 2. Integration Tests (`*.integration.test.js`)
- Test component interactions and data flow
- Database operations with mocked data
- Service layer integration testing

### 3. Webhook Simulation Tests (`webhook.simulation.test.js`)
- Complete webhook event processing simulation
- All Salla webhook events covered
- Point allocation and deduction testing
- Email notification verification

### 4. End-to-End Tests (`*.e2e.test.js`)
- Complete request-to-response flow testing
- HTTP request handling with proper headers
- Webhook security validation
- Database state verification
- Error scenario testing

## 🔒 Security Testing

### Webhook Security Validation
- ✅ Signature verification with HMAC-SHA256
- ✅ Invalid signature rejection
- ✅ Missing signature handling
- ✅ Payload structure validation
- ✅ Environment configuration testing

### Error Handling
- ✅ Database connection failures
- ✅ Missing merchant/customer scenarios
- ✅ Email service failures
- ✅ Invalid webhook payloads
- ✅ Rate limiting simulation

## 📈 Performance Testing

### Concurrency Tests
- Multiple webhook processing
- Database operation optimization
- Memory leak detection
- Response time validation

### Load Testing Scenarios
```bash
# Run concurrent webhook tests
npx mocha tests/webhook.e2e.test.js --grep "concurrent"

# Performance-focused tests
npx mocha tests/*.test.js --grep "Performance"
```

## 🧹 Test Maintenance

### Adding New Tests
1. **For new webhook events**: Add to `webhook.simulation.test.js`
2. **For new loyalty features**: Add to `loyaltyEngine.integration.test.js`
3. **For new API endpoints**: Add to appropriate integration test file
4. **For new utilities**: Add to unit test files

### Mock Data Updates
- Update `test-helper.js` with new mock structures
- Keep webhook payloads synchronized with Salla API changes
- Update merchant/customer schemas as models evolve

### Test Data Management
```javascript
// Use test helper for consistent mock data
const testHelper = require('./test-helper');

// Create comprehensive mock data
const mockMerchant = testHelper.createMockMerchant({
    loyaltySettings: { customSetting: true }
});

// Generate webhook payloads
const webhookPayload = testHelper.createWebhookPayload('order.created', {
    amounts: { total: { amount: 500 } }
});
```

## 📝 Test Reports

### Coverage Reports
```bash
# Generate coverage report
npx nyc mocha tests/*.test.js

# HTML coverage report
npx nyc --reporter=html mocha tests/*.test.js
```

### Custom Reporters
```bash
# JSON output for CI/CD
npx mocha tests/*.test.js --reporter json > test-results.json

# TAP format
npx mocha tests/*.test.js --reporter tap

# Spec with colors
npx mocha tests/*.test.js --reporter spec --colors
```

## 🚨 Troubleshooting

### Common Issues

1. **"Webhook signature verification failed"**
   - Ensure `SALLA_WEBHOOK_SECRET` is set correctly
   - Check payload JSON formatting

2. **"Database connection failed"**
   - Verify MongoDB is running for integration tests
   - Check connection string configuration

3. **"Email service unavailable"**
   - Tests mock email service by default
   - Check email stub configuration in tests

4. **"Test timeout"**
   - Increase timeout with `--timeout 15000`
   - Check for unresolved promises in test code

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npx mocha tests/*.test.js

# Specific debug namespace
DEBUG=loyalty:* npx mocha tests/*.test.js
```

## 🎯 Integration Readiness Checklist

Before deploying to production, ensure all tests pass:

- [ ] All webhook events process correctly
- [ ] Point allocation and deduction working
- [ ] Coupon generation functioning
- [ ] Email notifications sending
- [ ] Security validation passing
- [ ] Error handling robust
- [ ] Database operations optimized
- [ ] Performance benchmarks met

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all existing tests still pass
3. Add integration tests for new webhook events
4. Update this README with new test descriptions
5. Run full test suite before submitting PR

---

**📧 Test Email**: All tests use `aywork73@gmail.com` for notification testing as requested.

**🔄 Continuous Testing**: Tests are designed to be run in CI/CD pipelines with proper environment setup.
