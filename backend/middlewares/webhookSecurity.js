const crypto = require('crypto');

/**
 * Middleware to verify Salla webhook signatures
 * This ensures that webhooks are genuinely from Salla
 */
const verifyWebhookSignature = (req, res, next) => {
    try {
        // Get the signature from the headers
        const signature = req.headers['x-salla-signature'] || req.headers['x-webhook-signature'];
        
        if (!signature) {
            console.warn('⚠️  Webhook received without signature');
            return res.status(401).json({ 
                error: 'Webhook signature missing',
                message: 'No signature provided in headers' 
            });
        }

        // Get the webhook secret from environment variables
        const webhookSecret = process.env.SALLA_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
            console.error('❌ SALLA_WEBHOOK_SECRET not configured');
            return res.status(500).json({ 
                error: 'Server configuration error',
                message: 'Webhook secret not configured' 
            });
        }

        // Get the raw body (should be JSON string)
        const rawBody = JSON.stringify(req.body);
        
        // Create expected signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        // Compare signatures
        const providedSignature = signature.replace('sha256=', '');
        
        if (!crypto.timingSafeEqual(
            Buffer.from(expectedSignature, 'hex'),
            Buffer.from(providedSignature, 'hex')
        )) {
            console.warn('⚠️  Invalid webhook signature detected');
            return res.status(401).json({ 
                error: 'Invalid signature',
                message: 'Webhook signature verification failed' 
            });
        }

        console.log('✅ Webhook signature verified successfully');
        next();
    } catch (error) {
        console.error('❌ Error verifying webhook signature:', error);
        return res.status(500).json({ 
            error: 'Signature verification failed',
            message: 'Internal error during signature verification' 
        });
    }
};

/**
 * Middleware to log webhook events for debugging
 */
const logWebhookEvent = (req, res, next) => {
    const { event, merchant, data } = req.body;
    
    console.log(`\n🔔 Webhook Event Received:
    📋 Event: ${event}
    🏪 Merchant: ${merchant}
    📊 Data: ${JSON.stringify(data, null, 2)}
    🕐 Timestamp: ${new Date().toISOString()}
    \n`);
    
    next();
};

/**
 * Middleware to validate webhook payload structure
 */
const validateWebhookPayload = (req, res, next) => {
    const { event, merchant, data } = req.body;
    
    if (!event) {
        return res.status(400).json({ 
            error: 'Invalid payload',
            message: 'Event type is required' 
        });
    }
    
    if (!merchant) {
        return res.status(400).json({ 
            error: 'Invalid payload',
            message: 'Merchant ID is required' 
        });
    }
    
    console.log(`✅ Webhook payload validated for event: ${event}`);
    next();
};

module.exports = {
    verifyWebhookSignature,
    logWebhookEvent,
    validateWebhookPayload
}; 