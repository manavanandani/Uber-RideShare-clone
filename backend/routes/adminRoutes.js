// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verifyRole = require('../middleware/verifyRole');
const { cacheMiddleware } = require('../config/redis');

router.get('/', verifyRole(['admin']), cacheMiddleware(300), adminController.getAllAdmins);
router.post('/', adminController.createAdmin);
router.post('/drivers/:driver_id/review', verifyRole(['admin']), adminController.reviewDriverAccount);
router.post('/customers/:customer_id/review', verifyRole(['admin']), adminController.reviewCustomerAccount);
router.get('/stats/summary', verifyRole(['admin']), cacheMiddleware(300), adminController.getSystemStats);
router.get('/:admin_id', verifyRole(['admin']), cacheMiddleware(60), adminController.getAdminById);
router.put('/:admin_id', verifyRole(['admin']), adminController.updateAdmin);
router.delete('/:admin_id', verifyRole(['admin']), adminController.deleteAdmin);

module.exports = router;