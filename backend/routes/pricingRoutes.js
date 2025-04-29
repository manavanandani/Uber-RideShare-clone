const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');

router.post('/estimate', pricingController.getFareEstimate);

module.exports = router;