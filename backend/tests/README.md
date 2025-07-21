# Backend Test Suite

This directory contains unit, integration, webhook simulation, and end-to-end (E2E) software tests for the loyalty system backend.

## Test Files

- `loyaltyEngine.unit.test.js`: Unit tests for the loyalty engine logic (points, coupon generation, notification, no active reward).
- `rewardController.integration.test.js`: Integration tests for reward application, coupon generation, and unused coupon case.
- `webhook.simulation.test.js`: Simulates webhook events (e.g., order.created) and verifies points awarding and notification (with email mock).
- `software.e2e.test.js`: End-to-end test covering the full flow: webhook triggers, coupon generation, manual reward, and coupon redemption (with all external dependencies mocked).

## Mocks
- All tests use Sinon to mock database models and email sending.
- Webhook and email flows are simulated for robust, production-like testing.

## Running Tests

1. Install dev dependencies:
   ```sh
   cd backend
   npm install --save-dev mocha chai sinon supertest
   ```
2. Run all tests:
   ```sh
   npx mocha tests/*.js
   ```

## Notes
- All tests use the customer email `aywork73@gmail.com` as requested.
- Expand tests as needed for new features or edge cases.
