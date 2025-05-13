const { CustomError } = require('../../../shared/utils/errors');
const { invalidateCache } = require('../config/redis');
const { createRide,
  getRideById,
  getAllRides,
  getRidesByCustomer,
  getRidesByDriver,
  getActiveRideForCustomer,
  getActiveRideForDriver,
  getNearbyRides,
  getRideStatsByLocation,
  updateRide,
  deleteRide,
  acceptRide,
  startRide,
  completeRide,
  cancelRideByCustomer,
  cancelRideByDriver,
  rateRide
} = require('../services/rideService');
const { sendMessage } = require('../kafka/producers/rideEventProducer');

exports.getAllRides = async (req, res) => {
  try {
    const { limit = 100, page = 1, status, customerId, driverId, startDate, endDate } = req.query;
    const rides = await getAllRides({ limit, page, status, customerId, driverId, startDate, endDate });
    res.status(200).json(rides);
  } catch (err) {
    console.error('Error retrieving rides:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getRideById = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const ride = await getRideById(ride_id, req.user);
    res.status(200).json(ride);
  } catch (err) {
    console.error('Error retrieving ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.createRide = async (req, res) => {
  try {
    const { pickup_location, dropoff_location, date_time, passenger_count } = req.body;
    const customer_id = req.user.customer_id;
    const ride = await createRide({ pickup_location, dropoff_location, date_time, passenger_count, customer_id });
    await sendMessage({
      topic: 'ride.events',
      message: {
        key: ride.ride_id,
        value: {
          event_type: 'RIDE_REQUESTED',
          ride_id: ride.ride_id,
          pickup_location: {
            latitude: ride.pickup_location.coordinates[1],
            longitude: ride.pickup_location.coordinates[0]
          },
          dropoff_location: {
            latitude: ride.dropoff_location.coordinates[1],
            longitude: ride.dropoff_location.coordinates[0]
          },
          date_time: ride.date_time,
          customer_id: ride.customer_id,
          passenger_count: ride.passenger_count,
          fare_amount: ride.fare_amount,
          distance: ride.distance,
          duration: ride.duration,
          surge_factor: ride.surge_factor,
          fare_breakdown: ride.fare_breakdown
        }
      }
    });
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${customer_id}*`);
    res.status(201).json({ message: 'Ride created successfully', data: ride });
  } catch (err) {
    console.error('Error creating ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.updateRide = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const updates = req.body;
    const customer_id = req.user.customer_id;
    const updatedRide = await updateRide(ride_id, customer_id, updates);
    await sendMessage({
      topic: 'ride.events',
      message: {
        key: ride_id,
        value: {
          event_type: 'RIDE_UPDATED',
          ride_id,
          customer_id,
          updates: {
            pickup_location: updatedRide.pickup_location ? {
              latitude: updatedRide.pickup_location.coordinates[1],
              longitude: updatedRide.pickup_location.coordinates[0]
            } : undefined,
            dropoff_location: updatedRide.dropoff_location ? {
              latitude: updatedRide.dropoff_location.coordinates[1],
              longitude: updatedRide.dropoff_location.coordinates[0]
            } : undefined,
            date_time: updatedRide.date_time,
            passenger_count: updatedRide.passenger_count,
            fare_amount: updatedRide.fare_amount,
            distance: updatedRide.distance,
            duration: updatedRide.duration,
            fare_breakdown: updatedRide.fare_breakdown
          }
        }
      }
    });
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${customer_id}*`);
    if (updatedRide.driver_id) await invalidateCache(`*driver*${updatedRide.driver_id}*`);
    res.status(200).json({ message: 'Ride updated successfully', data: updatedRide });
  } catch (err) {
    console.error('Error updating ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.deleteRide = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const customer_id = req.user.customer_id;
    const ride = await deleteRide(ride_id, customer_id);
    await sendMessage({
      topic: 'ride.events',
      message: {
        key: ride_id,
        value: {
          event_type: 'RIDE_CANCELLED',
          ride_id,
          customer_id,
          cancellation_reason: 'customer_cancelled'
        }
      }
    });
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${customer_id}*`);
    if (ride.driver_id) await invalidateCache(`*driver*${ride.driver_id}*`);
    res.status(200).json({ message: 'Ride deleted successfully' });
  } catch (err) {
    console.error('Error deleting ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getRidesByCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const user = req.user;
    const rides = await getRidesByCustomer(customer_id, user);
    res.status(200).json(rides);
  } catch (err) {
    console.error('Error fetching customer rides:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getRidesByDriver = async (req, res) => {
  try {
    const { driver_id } = req.params;
    const user = req.user;
    const rides = await getRidesByDriver(driver_id, user);
    res.status(200).json(rides);
  } catch (err) {
    console.error('Error fetching driver rides:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getActiveRideForCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const user = req.user;
    const ride = await getActiveRideForCustomer(customer_id, user);
    res.status(200).json(ride);
  } catch (err) {
    console.error('Error retrieving active ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getActiveRideForDriver = async (req, res) => {
  try {
    const { driver_id } = req.params;
    const user = req.user;
    const ride = await getActiveRideForDriver(driver_id, user);
    res.status(200).json(ride);
  } catch (err) {
    console.error('Error retrieving active ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getNearbyRides = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const driver_id = req.user.driver_id;
    const rides = await getNearbyRides(latitude, longitude, driver_id);
    res.status(200).json(rides);
  } catch (err) {
    console.error('Error fetching nearby rides:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.getRideStatsByLocation = async (req, res) => {
  try {
    const stats = await getRideStatsByLocation();
    res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching ride stats:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const driver_id = req.user.driver_id;
    const updatedRide = await acceptRide(ride_id, driver_id);
    await sendMessage({
      topic: 'ride.events',
      message: {
        key: ride_id,
        value: {
          event_type: 'RIDE_ACCEPTED',
          ride_id,
          driver_id,
          customer_id: updatedRide.customer_id
        }
      }
    });
    await invalidateCache('*rides*');
    await invalidateCache(`*driver*${driver_id}*`);
    res.status(200).json({ message: 'Ride accepted successfully', data: updatedRide });
  } catch (err) {
    console.error('Error accepting ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.startRide = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const driver_id = req.user.driver_id;
    const updatedRide = await startRide(ride_id, driver_id);
    await sendMessage({
      topic: 'ride.events',
      message: {
        key: ride_id,
        value: {
          event_type: 'RIDE_STARTED',
          ride_id,
          driver_id,
          customer_id: updatedRide.customer_id
        }
      }
    });
    await invalidateCache('*rides*');
    await invalidateCache(`*driver*${driver_id}*`);
    await invalidateCache(`*customer*${updatedRide.customer_id}*`);
    res.status(200).json({ message: 'Ride started successfully', data: updatedRide });
  } catch (err) {
    console.error('Error starting ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.completeRide = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const driver_id = req.user.driver_id;
    const updatedRide = await completeRide(ride_id, driver_id);
    await sendMessage({
      topic: 'ride.events',
      message: {
        key: ride_id,
        value: {
          event_type: 'RIDE_COMPLETED',
          ride_id,
          driver_id,
          customer_id: updatedRide.customer_id,
          pickup_location: {
            latitude: updatedRide.pickup_location.coordinates[1],
            longitude: updatedRide.pickup_location.coordinates[0]
          },
          dropoff_location: {
            latitude: updatedRide.dropoff_location.coordinates[1],
            longitude: updatedRide.dropoff_location.coordinates[0]
          },
          date_time: updatedRide.date_time,
          distance: updatedRide.distance,
          duration: updatedRide.duration,
          fare_amount: updatedRide.fare_amount,
          fare_breakdown: updatedRide.fare_breakdown
        }
      }
    });
    await invalidateCache('*rides*');
    await invalidateCache(`*driver*${driver_id}*`);
    await invalidateCache(`*customer*${updatedRide.customer_id}*`);
    res.status(200).json({ message: 'Ride completed successfully', data: updatedRide });
  } catch (err) {
    console.error('Error completing ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.cancelRideByCustomer = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const { reason } = req.body;
    const customer_id = req.user.customer_id;
    const updatedRide = await cancelRideByCustomer(ride_id, customer_id, reason);
    await sendMessage({
      topic: 'ride.events',
      message: {
        key: ride_id,
        value: {
          event_type: 'RIDE_CANCELLED',
          ride_id,
          customer_id,
          driver_id: updatedRide.driver_id,
          cancellation_reason: 'customer_cancelled',
          reason
        }
      }
    });
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${customer_id}*`);
    if (updatedRide.driver_id) await invalidateCache(`*driver*${updatedRide.driver_id}*`);
    res.status(200).json({ message: 'Ride cancelled successfully', data: updatedRide });
  } catch (err) {
    console.error('Error cancelling ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.cancelRideByDriver = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const { reason } = req.body;
    const driver_id = req.user.driver_id;
    const updatedRide = await cancelRideByDriver(ride_id, driver_id, reason);
    await sendMessage({
      topic: 'ride.events',
      message: {
        key: ride_id,
        value: {
          event_type: 'RIDE_CANCELLED',
          ride_id,
          customer_id: updatedRide.customer_id,
          driver_id,
          cancellation_reason: 'driver_cancelled',
          reason
        }
      }
    });
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${updatedRide.customer_id}*`);
    await invalidateCache(`*driver*${driver_id}*`);
    res.status(200).json({ message: 'Ride cancelled successfully', data: updatedRide });
  } catch (err) {
    console.error('Error cancelling ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.rateRide = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const { rating, comment } = req.body;
    const user = req.user;
    const updatedRide = await rateRide(ride_id, user, rating, comment);
    await sendMessage({
      topic: 'ride.events',
      message: {
        key: ride_id,
        value: {
          event_type: 'RIDE_RATED',
          ride_id,
          customer_id: user.customer_id || updatedRide.customer_id,
          driver_id: user.driver_id || updatedRide.driver_id,
          rating_by: user.customer_id ? 'customer' : 'driver',
          rating,
          comment
        }
      }
    });
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${updatedRide.customer_id}*`);
    if (updatedRide.driver_id) await invalidateCache(`*driver*${updatedRide.driver_id}*`);
    res.status(200).json({ message: 'Ride rated successfully', data: updatedRide });
  } catch (err) {
    console.error('Error rating ride:', err);
    res.status(err.status || 500).json({ message: err.message });
  }
};