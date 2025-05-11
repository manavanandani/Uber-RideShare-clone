const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminLogin, getCurrentUser } = require('../controllers/authController');

const router = express.Router();

router.post('/login', adminLogin);
router.get('/me', authMiddleware(['admin']), getCurrentUser);

module.exports = router;