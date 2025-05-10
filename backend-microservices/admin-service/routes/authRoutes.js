const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyRole = require('../middleware/verifyRole');

// Login route for admin
router.post('/admin/login', authController.adminLogin);

// Get current authenticated user
router.get('/me', verifyRole(['admin']), authController.getCurrentUser);

module.exports = router;