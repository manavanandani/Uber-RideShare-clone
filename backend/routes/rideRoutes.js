const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const verifyRole = require('../middleware/verifyRole');
const { cacheMiddleware } = require('../config/redis');

// Customer routes
router.post('/', verifyRole('customer'), rideController.createRide);
router.patch('/:ride_id', verifyRole('customer'), rideController.updateRide);
router.delete('/:ride_id', verifyRole('customer'), rideController.deleteRide);
router.get('/customer/:customer_id', verifyRole('customer'), cacheMiddleware(60), rideController.getRidesByCustomer);
router.post('/:ride_id/rate', verifyRole('customer'), rideController.rateRide);
router.get('/nearby-drivers', verifyRole('customer'), rideController.getNearbyDrivers);

// Driver routes
router.get('/driver/:driver_id', verifyRole('driver'), cacheMiddleware(60), rideController.getRidesByDriver);
router.patch('/:ride_id/accept', verifyRole('driver'), rideController.acceptRide);
router.patch('/:ride_id/start', verifyRole('driver'), rideController.startRide);
router.patch('/:ride_id/complete', verifyRole('driver'), rideController.completeRide);
router.post('/:ride_id/rate-customer', verifyRole('driver'), rideController.rateRide);

// Admin routes
router.get('/stats/location', verifyRole('admin'), cacheMiddleware(300), rideController.getRideStatsByLocation);

module.exports = router;