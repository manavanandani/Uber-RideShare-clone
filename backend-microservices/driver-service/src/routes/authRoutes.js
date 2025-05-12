const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const bulkRequestHandler = require('../middleware/bulkRequestMiddleware');

router.post('/login', authController.driverLogin);
router.post('/register', bulkRequestHandler(authController.registerDriver));
router.get('/me', authMiddleware(['driver']), authController.getCurrentUser);

module.exports = router;