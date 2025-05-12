const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const bulkRequestHandler = require('../middleware/bulkRequestMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../config/gridFsStorage');
const { cacheMiddleware } = require('../config/redis');

router.get('/available', cacheMiddleware(60), driverController.getAvailableDrivers);
router.get('/search', authMiddleware(['admin', 'customer']), driverController.searchDrivers);
router.get('/', authMiddleware(['admin', 'driver']), driverController.getAllDrivers);
router.get('/:driver_id', authMiddleware(['admin', 'driver']), cacheMiddleware(60), driverController.getDriverById);
router.post('/', authMiddleware(['admin']), bulkRequestHandler(driverController.createDriver));
router.put('/:driver_id', authMiddleware(['admin', 'driver']), driverController.updateDriver);
router.delete('/:driver_id', authMiddleware(['admin', 'driver']), driverController.deleteDriver);
router.patch('/:driver_id/status', authMiddleware(['admin', 'driver']), driverController.updateDriverStatus);
router.post('/:driver_id/media', authMiddleware(['admin', 'driver']), upload.single('file'), driverController.uploadDriverMedia);
router.get('/:driver_id/reviews', authMiddleware(['admin', 'driver', 'customer']), cacheMiddleware(120), driverController.getDriverReviews);
router.patch('/:driver_id/address', authMiddleware(['admin', 'driver']), driverController.updateDriverAddress);

module.exports = router;