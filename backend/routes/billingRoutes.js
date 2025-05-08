const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const verifyRole = require('../middleware/verifyRole');
const { cacheMiddleware } = require('../config/redis');

router.post('/', verifyRole('driver'), billingController.createBill);
router.get('/search', verifyRole('admin'), billingController.searchBills);
router.get('/customer/:customer_id', verifyRole(['admin', 'customer']), cacheMiddleware(120), billingController.getAllCustomerBills);
router.get('/driver/:driver_id', verifyRole(['admin', 'driver']), cacheMiddleware(120), billingController.getAllDriverBills);
router.get('/:bill_id', verifyRole(['admin', 'customer', 'driver']), cacheMiddleware(120), billingController.getBill);
router.post('/:bill_id/pay', verifyRole(['admin', 'customer']), billingController.processPayment);
router.delete('/:bill_id', verifyRole('admin'), billingController.deleteBill);

module.exports = router;