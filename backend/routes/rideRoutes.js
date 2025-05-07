const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const verifyRole = require('../middleware/verifyRole');
const { cacheMiddleware } = require('../config/redis');

router.post('/', verifyRole('customer'), rideController.createRide);
router.get('/customer/:customer_id', verifyRole('customer'), cacheMiddleware(60), rideController.getRidesByCustomer);
router.get('/customer/:customer_id/active', verifyRole('customer'), rideController.getActiveRideForCustomer);
router.get('/driver/:driver_id', verifyRole('driver'), cacheMiddleware(60), rideController.getRidesByDriver);
router.get('/driver/:driver_id/active', verifyRole('driver'), rideController.getActiveRideForDriver);
router.get('/nearby', verifyRole('driver'), rideController.getNearbyRides);
router.get('/stats/location', verifyRole('admin'), cacheMiddleware(300), rideController.getRideStatsByLocation);
router.get('/admin/all', verifyRole('admin'), cacheMiddleware(60), rideController.getAllRides);
//router.post('/test-create', verifyRole('admin'), rideController.createTestRide);
//router.patch('/test/:ride_id/accept', verifyRole('admin'), rideController.testAcceptRide);
//router.patch('/test/:ride_id/start', verifyRole('admin'), rideController.testStartRide);
//router.patch('/test/:ride_id/complete', verifyRole('admin'), rideController.testCompleteRide);
router.patch('/:ride_id', verifyRole('customer'), rideController.updateRide);
router.delete('/:ride_id', verifyRole('customer'), rideController.deleteRide);
router.post('/:ride_id/rate', verifyRole('customer'), rideController.rateRide);
router.patch('/:ride_id/accept', verifyRole('driver'), rideController.acceptRide);
router.patch('/:ride_id/start', verifyRole('driver'), rideController.startRide);
router.patch('/:ride_id/complete', verifyRole('driver'), rideController.completeRide);
router.post('/:ride_id/rate-customer', verifyRole('driver'), rideController.rateRide);

module.exports = router;