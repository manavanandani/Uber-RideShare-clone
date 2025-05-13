const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authMiddleware = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../config/redis');

router.post('/', authMiddleware(['customer']), rideController.createRide);
router.get('/customer/:customer_id', authMiddleware(['customer']), cacheMiddleware(60), rideController.getRidesByCustomer);
router.get('/customer/:customer_id/active', authMiddleware(['customer']), rideController.getActiveRideForCustomer);
router.get('/driver/:driver_id', authMiddleware(['driver']), cacheMiddleware(60), rideController.getRidesByDriver);
router.get('/driver/:driver_id/active', authMiddleware(['driver']), rideController.getActiveRideForDriver);
router.get('/nearby', authMiddleware(['driver']), rideController.getNearbyRides);
router.get('/stats/location', authMiddleware(['admin']), cacheMiddleware(300), rideController.getRideStatsByLocation);
router.get('/admin/all', authMiddleware(['admin']), cacheMiddleware(60), rideController.getAllRides);
router.get('/:ride_id', authMiddleware(['admin', 'customer', 'driver']), rideController.getRideById);
router.patch('/:ride_id', authMiddleware(['customer']), rideController.updateRide);
router.delete('/:ride_id', authMiddleware(['customer']), rideController.deleteRide);
router.post('/:ride_id/rate', authMiddleware(['customer', 'driver']), rideController.rateRide);
router.patch('/:ride_id/accept', authMiddleware(['driver']), rideController.acceptRide);
router.patch('/:ride_id/start', authMiddleware(['driver']), rideController.startRide);
router.patch('/:ride_id/complete', authMiddleware(['driver']), rideController.completeRide);
router.patch('/:ride_id/cancel-customer', authMiddleware(['customer']), rideController.cancelRideByCustomer);
router.patch('/:ride_id/cancel-driver', authMiddleware(['driver']), rideController.cancelRideByDriver);

module.exports = router;