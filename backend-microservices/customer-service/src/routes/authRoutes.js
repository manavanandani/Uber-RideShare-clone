const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const bulkRequestHandler = require('../middleware/bulkRequestMiddleware');

router.post('/login', authController.customerLogin);
router.post('/register', bulkRequestHandler(authController.registerCustomer));
router.get('/me', authMiddleware(['customer']), authController.getCurrentUser);

module.exports = router;