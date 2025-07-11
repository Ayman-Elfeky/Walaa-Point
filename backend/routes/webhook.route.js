const express = require('express');
const router = express.Router();
const webhookLogic = require('../controllers/webhook.controller');

router.post('/', webhookLogic);

module.exports = router;