const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../config/redis');

router.get('/search', authMiddleware('admin'), billingController.searchBills);
router.get('/customer/:customer_id', authMiddleware(['admin', 'customer']), cacheMiddleware(120), billingController.getAllCustomerBills);
router.get('/driver/:driver_id', authMiddleware(['admin', 'driver']), cacheMiddleware(120), billingController.getAllDriverBills);
router.get('/:bill_id', authMiddleware(['admin', 'customer', 'driver']), cacheMiddleware(120), billingController.getBill);
router.post('/:bill_id/pay', authMiddleware(['admin', 'customer']), billingController.processPayment);
router.delete('/:bill_id', authMiddleware('admin'), billingController.deleteBill);

module.exports = router;