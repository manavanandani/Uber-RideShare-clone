const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const verifyRole = require('../middleware/verifyRole');
const { cacheMiddleware } = require('../config/redis');

// Create a bill
router.post('/', verifyRole('driver'), billingController.createBill);

// Search bills (admin only)
router.get('/search', verifyRole('admin'), billingController.searchBills);

// Get a bill by ID
router.get('/:bill_id', verifyRole(['admin', 'customer', 'driver']), cacheMiddleware(120), billingController.getBill);

// Delete a bill (admin only)
router.delete('/:bill_id', verifyRole('admin'), billingController.deleteBill);

// Get all bills for a customer
router.get('/customer/:customer_id', verifyRole(['admin', 'customer']), cacheMiddleware(120), billingController.getAllCustomerBills);

// Get all bills for a driver
router.get('/driver/:driver_id', verifyRole(['admin', 'driver']), cacheMiddleware(120), billingController.getAllDriverBills);

// Process payment
router.post('/:bill_id/pay', verifyRole(['admin', 'customer']), billingController.processPayment);

module.exports = router;