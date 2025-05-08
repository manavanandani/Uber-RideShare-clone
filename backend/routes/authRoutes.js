const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyRole = require('../middleware/verifyRole');

router.post('/admin/login', authController.adminLogin);
router.post('/driver/login', authController.driverLogin);
router.post('/customer/login', authController.customerLogin);
router.post('/customer/register', authController.registerCustomer);
router.post('/driver/register', authController.registerDriver);
router.get('/me', verifyRole(['admin', 'driver', 'customer']), authController.getCurrentUser);

module.exports = router;