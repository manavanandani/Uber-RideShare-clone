// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const verifyRole = require('../middleware/verifyRole');
const upload = require('../config/gridFsStorage');
const { cacheMiddleware } = require('../config/redis');

// Admin routes
router.get('/', verifyRole(['admin']), cacheMiddleware(300), customerController.getAllCustomers);
router.post('/', verifyRole(['admin']), customerController.createCustomer);
router.delete('/:customer_id', verifyRole(['admin']), customerController.deleteCustomer);

// Customer or admin routes
router.get('/:customer_id', verifyRole(['admin', 'customer']), cacheMiddleware(60), customerController.getCustomerById);
router.put('/:customer_id', verifyRole(['admin', 'customer']), customerController.updateCustomer);

// Search customers
router.get('/search', verifyRole(['admin']), customerController.searchCustomers);

// Customer location update
router.patch('/:customer_id/location', verifyRole(['customer']), customerController.updateCustomerLocation);

// Get customer reviews
router.get('/:customer_id/reviews', verifyRole(['admin', 'driver', 'customer']), cacheMiddleware(120), customerController.getCustomerReviews);

// Upload ride images
router.post('/:customer_id/rides/:ride_id/images', verifyRole(['customer']), upload.array('images', 5), customerController.uploadRideImages);

module.exports = router;