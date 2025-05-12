const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const bulkRequestHandler = require('../middleware/bulkRequestMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../config/gridFsStorage');
const { cacheMiddleware } = require('../config/redis');

router.get('/', authMiddleware(['admin']), customerController.getAllCustomers);
router.post('/', authMiddleware(['admin']), bulkRequestHandler(customerController.createCustomer));
router.get('/search', authMiddleware(['admin']), customerController.searchCustomers);
router.get('/:customer_id', authMiddleware(['admin', 'customer']), cacheMiddleware(60), customerController.getCustomerById);
router.patch('/:customer_id', authMiddleware(['admin', 'customer']), customerController.updateCustomer);
router.delete('/:customer_id', authMiddleware(['admin', 'customer']), customerController.deleteCustomerProfile);
router.patch('/:customer_id/location', authMiddleware(['customer']), customerController.updateCustomerLocation);
router.get('/:customer_id/reviews', authMiddleware(['admin', 'driver', 'customer']), cacheMiddleware(120), customerController.getCustomerReviews);
router.post('/:customer_id/rides/:ride_id/images', authMiddleware(['customer']), upload.array('images', 5), customerController.uploadRideImages);
router.post('/:customer_id/media', authMiddleware(['admin', 'customer']), upload.single('file'), customerController.uploadCustomerMedia);

module.exports = router;