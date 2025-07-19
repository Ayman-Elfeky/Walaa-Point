const express = require('express');
const router = express.Router();
const webhookLogic = require('../controllers/webhook.controller');
const { 
    verifyWebhookSignature, 
    logWebhookEvent, 
    validateWebhookPayload 
} = require('../middlewares/webhookSecurity');

console.log('Webhook route initialized');

// Apply middleware in order: logging -> validation -> security -> logic
router.post('/', 
    // logWebhookEvent,
    // validateWebhookPayload,
    // verifyWebhookSignature,
    webhookLogic
);

module.exports = router;