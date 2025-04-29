// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyRole = require('../middleware/verifyRole');

// Login routes
router.post('/admin/login', authController.adminLogin);
router.post('/driver/login', authController.driverLogin);
router.post('/customer/login', authController.customerLogin);

// Registration routes
router.post('/customer/register', authController.registerCustomer);
router.post('/driver/register', authController.registerDriver);

// Get current user profile
router.get('/me', verifyRole(['admin', 'driver', 'customer']), authController.getCurrentUser);

module.exports = router;