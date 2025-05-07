// routes/driverRoutes.js
const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const bulkRequestHandler = require('../middleware/bulkRequestMiddleware');
const verifyRole = require('../middleware/verifyRole');
const upload = require('../config/gridFsStorage');
const { cacheMiddleware } = require('../config/redis');

// Public routes
router.get('/available', cacheMiddleware(60), driverController.getAvailableDrivers);
router.get('/search', verifyRole(['admin', 'customer']), driverController.searchDrivers);
// Driver or admin routes
router.get('/', verifyRole(['admin', 'driver']), cacheMiddleware(300), driverController.getAllDrivers);
router.get('/:driver_id', verifyRole(['admin', 'driver']), cacheMiddleware(60), driverController.getDriverById);
router.post('/', verifyRole(['admin']), bulkRequestHandler(driverController.createDriver));
router.put('/:driver_id', verifyRole(['admin', 'driver']), driverController.updateDriver);
router.delete('/:driver_id', verifyRole(['admin']), driverController.deleteDriver);


// Driver status update
router.patch('/:driver_id/status', verifyRole(['admin', 'driver']), driverController.updateDriverStatus);

// Media upload for driver introduction
router.post('/:driver_id/media', verifyRole(['admin', 'driver']), upload.single('media'), driverController.uploadDriverMedia);

// Get driver reviews
router.get('/:driver_id/reviews', verifyRole(['admin', 'driver', 'customer']), cacheMiddleware(120), driverController.getDriverReviews);

router.patch('/:driver_id/address', verifyRole(['admin', 'driver']), driverController.updateDriverAddress);


module.exports = router;