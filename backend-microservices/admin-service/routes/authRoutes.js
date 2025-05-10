    const express = require('express');
    const router = express.Router();
    const authController = require('../controllers/authController');
    const verifyRole = require('../middleware/verifyRole');

    // Login routes
    router.post('/admin/login', authController.adminLogin);

    // Get current user profile
    router.get('/me', verifyRole('admin'), authController.getCurrentUser);
    module.exports = router;