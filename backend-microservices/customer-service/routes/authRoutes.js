const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyRole = require('../middleware/verifyRole');

router.post('/customer/login', authController.customerLogin);
router.post('/customer/register', authController.registerCustomer);
router.get('/me', verifyRole('customer'), authController.getCurrentUser);