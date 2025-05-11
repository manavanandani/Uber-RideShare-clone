const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  reviewDriverAccount,
  reviewCustomerAccount,
  getSystemStats,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/', authMiddleware(['admin']), getAllAdmins);
router.get('/:admin_id', authMiddleware(['admin']), getAdminById);
router.post('/', authMiddleware(['admin']), createAdmin);
router.put('/:admin_id', authMiddleware(['admin']), updateAdmin);
router.delete('/:admin_id', authMiddleware(['admin']), deleteAdmin);
router.post('/drivers/:driver_id/review', authMiddleware(['admin']), reviewDriverAccount);
router.post('/customers/:customer_id/review', authMiddleware(['admin']), reviewCustomerAccount);
router.get('/stats', authMiddleware(['admin']), getSystemStats);

module.exports = router;