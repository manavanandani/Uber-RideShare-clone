const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyRole = require('../middleware/verifyRole');

router.post('/driver/login', authController.driverLogin);
router.post('/driver/register', authController.registerDriver);
router.get('/me', verifyRole('driver'), authController.getCurrentUser);

module.exports = router;