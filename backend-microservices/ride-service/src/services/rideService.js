const axios = require('axios');
const { Ride } = require('../../model/ride');
const { CustomError } = require('../../../../shared/utils/errors');
const { latLngToMongoLocation } = require('../../utils/locationUtils');
const { redisClient } = require('../../config/redis');
const { calculateDistance } = require('../../../customer/src/services/pricingService'); // Shared function

const generateRideId = () => {
  const part1 = Math.floor(Math.random() * 900) + 100;
  const part2 = Math.floor(Math.random() * 90) + 10;
  const part3 = Math.floor(Math.random() * 9000) + 1000;
  return `${part1}-${part2}-${part3}`;
};

const getAllRides = async ({ limit = 100, page = 1, status, customerId, driverId, startDate, endDate }) => {
  const query = {};
  if (status && status !== 'all') query.status = status;
  if (customerId) query.customer_id = customerId;
  if (driverId) query.driver_id = driverId;
  if (startDate || endDate) {
    query.date_time = {};
    if (startDate) query.date_time.$gte = new Date(startDate);
    if (endDate) query.date_time.$lte = new Date(endDate);
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const rides = await Ride.find(query).sort({ date_time: -1 }).skip(skip).limit(parseInt(limit));
  const total = await Ride.countDocuments(query);
  return {
    message: 'Rides retrieved successfully',
    data: rides,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
  };
};

const getRideById = async (ride_id, user) => {
  const ride = await Ride.findOne({ ride_id });
  if (!ride) throw new CustomError('Ride not found', 404);
  const isAdmin = user.role === 'admin';
  const isDriver = user.role === 'driver' && user.driver_id === ride.driver_id;
  const isCustomer = user.role === 'customer' && user.customer_id === ride.customer_id;
  if (!isAdmin && !isDriver && !isCustomer) throw new CustomError('Unauthorized to view this ride', 403);
  const driver_info = ride.driver_id ? await redisClient.get(`driver:${ride.driver_id}`) : null;
  const customer_info = await redisClient.get(`customer:${ride.customer_id}`);
  return {
    message: 'Ride retrieved successfully',
    data: {
      ...ride.toObject(),
      driver_info: driver_info ? JSON.parse(driver_info) : null,
      customer_info: customer_info ? JSON.parse(customer_info) : null
    }
  };
};

const createRide = async ({ pickup_location, dropoff_location, date_time, passenger_count, customer_id }) => {
  const activeRide = await Ride.findOne({ customer_id, status: { $in: ['requested', 'accepted', 'in_progress'] } });
  if (activeRide) throw new CustomError(`You already have an active ride: ${activeRide.ride_id}`, 400);
  const pickupGeo = latLngToMongoLocation(pickup_location);
  const dropoffGeo = latLngToMongoLocation(dropoff_location);
  let ride_id;
  let isUnique = false;
  while (!isUnique) {
    ride_id = generateRideId();
    const existingRide = await Ride.findOne({ ride_id });
    if (!existingRide) isUnique = true;
  }
  const priceResponse = await axios.post(process.env.CUSTOMER_SERVICE_URL + '/api/pricing/estimate', {
    pickup_latitude: pickup_location.latitude,
    pickup_longitude: pickup_location.longitude,
    dropoff_latitude: dropoff_location.latitude,
    dropoff_longitude: dropoff_location.longitude,
    datetime: date_time || new Date().toISOString(),
    passenger_count: passenger_count || 1
  });
  const priceData = priceResponse.data.data;
  const ride = new Ride({
    ride_id,
    pickup_location: pickupGeo,
    dropoff_location: dropoffGeo,
    date_time: new Date(date_time || Date.now()),
    customer_id,
    driver_id: null,
    fare_amount: priceData.fare,
    passenger_count: passenger_count || 1,
    distance: priceData.distance || undefined,
    duration: priceData.duration || undefined,
    surge_factor: priceData.demandSurge || 1.0,
    status: 'requested',
    fare_breakdown: priceData.breakdown || undefined
  });
  return await ride.save();
};

const updateRide = async (ride_id, customer_id, updates) => {
  const ride = await Ride.findOne({ ride_id, customer_id });
  if (!ride) throw new CustomError('Ride not found or not authorized', 404);
  const allowedUpdates = {};
  if (ride.status === 'requested') {
    if (updates.pickup_location) allowedUpdates.pickup_location = latLngToMongoLocation(updates.pickup_location);
    if (updates.dropoff_location) allowedUpdates.dropoff_location = latLngToMongoLocation(updates.dropoff_location);
    if (updates.passenger_count) allowedUpdates.passenger_count = updates.passenger_count;
    if (updates.date_time) allowedUpdates.date_time = new Date(updates.date_time);
    if (updates.pickup_location || updates.dropoff_location || updates.passenger_count) {
      const priceResponse = await axios.post(process.env.CUSTOMER_SERVICE_URL + '/api/pricing/estimate', {
        pickup_latitude: (updates.pickup_location || { latitude: ride.pickup_location.coordinates[1] }).latitude,
        pickup_longitude: (updates.pickup_location || { longitude: ride.pickup_location.coordinates[0] }).longitude,
        dropoff_latitude: (updates.dropoff_location || { latitude: ride.dropoff_location.coordinates[1] }).latitude,
        dropoff_longitude: (updates.dropoff_location || { longitude: ride.dropoff_location.coordinates[0] }).longitude,
        datetime: updates.date_time ? new Date(updates.date_time).toISOString() : ride.date_time,
        passenger_count: updates.passenger_count || ride.passenger_count
      });
      const priceData = priceResponse.data.data;
      allowedUpdates.fare_amount = priceData.fare;
      allowedUpdates.distance = priceData.distance || undefined;
      allowedUpdates.duration = priceData.duration || undefined;
      allowedUpdates.fare_breakdown = priceData.breakdown || undefined;
    }
  } else if (ride.status === 'completed' && updates.rating) {
    allowedUpdates['rating.customer_to_driver'] = updates.rating;
  }
  if (Object.keys(allowedUpdates).length === 0) throw new CustomError('No valid updates provided or ride cannot be updated', 400);
  const updatedRide = await Ride.findOneAndUpdate({ ride_id }, { $set: allowedUpdates }, { new: true, runValidators: true });
  if (!updatedRide) throw new CustomError('Ride update failed', 500);
  return updatedRide;
};

const deleteRide = async (ride_id, customer_id) => {
  const ride = await Ride.findOne({ ride_id, customer_id });
  if (!ride) throw new CustomError('Ride not found or not authorized', 404);
  if (ride.status !== 'requested') throw new CustomError('Cannot delete a ride that has been accepted or completed', 400);
  await Ride.findOneAndDelete({ ride_id });
  return ride;
};

const getRidesByCustomer = async (customer_id, user) => {
  const isAdmin = user.role === 'admin';
  if (!isAdmin && customer_id !== user.customer_id) throw new CustomError('Unauthorized access', 403);
  const rides = await Ride.find({ customer_id }).sort({ date_time: -1 });
  return { message: 'Rides retrieved successfully', count: rides.length, data: rides };
};

const getRidesByDriver = async (driver_id, user) => {
  if (driver_id !== user.driver_id && user.role !== 'admin') throw new CustomError('Unauthorized access', 403);
  const rides = await Ride.find({ driver_id }).sort({ date_time: -1 });
  return { message: 'Rides retrieved successfully', data: rides };
};

const getActiveRideForCustomer = async (customer_id, user) => {
  if (customer_id !== user.customer_id && user.role !== 'admin') throw new CustomError('Unauthorized access', 403);
  const activeRide = await Ride.findOne({ customer_id, status: { $in: ['requested', 'accepted', 'in_progress'] } }).sort({ date_time: -1 });
  if (!activeRide) return { message: 'No active ride found', data: null };
  const driver_info = activeRide.driver_id ? await redisClient.get(`driver:${activeRide.driver_id}`) : null;
  return {
    message: 'Active ride retrieved successfully',
    data: { ...activeRide.toObject(), driver_info: driver_info ? JSON.parse(driver_info) : null }
  };
};

const getActiveRideForDriver = async (driver_id, user) => {
  if (driver_id !== user.driver_id && user.role !== 'admin') throw new CustomError('Unauthorized access', 403);
  const activeRide = await Ride.findOne({ driver_id, status: { $in: ['accepted', 'in_progress'] } }).sort({ date_time: -1 });
  if (!activeRide) return { message: 'No active ride found', data: null };
  const customer_info = await redisClient.get(`customer:${activeRide.customer_id}`);
  return {
    message: 'Active ride retrieved successfully',
    data: { ...activeRide.toObject(), customer_info: customer_info ? JSON.parse(customer_info) : null }
  };
};

const getNearbyRides = async (latitude, longitude, driver_id) => {
  if (!latitude || !longitude) throw new CustomError('Latitude and longitude are required', 400);
  const driverLat = parseFloat(latitude);
  const driverLng = parseFloat(longitude);
  const rides = await Ride.find({
    status: 'requested',
    driver_id: null,
    pickup_location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [driverLng, driverLat] },
        $maxDistance: 16000 // 16km
      }
    }
  }).sort({ date_time: 1 });
  const ridesWithDetails = await Promise.all(rides.map(async (ride) => {
    const customer_info = await redisClient.get(`customer:${ride.customer_id}`);
    const pickupLocation = { longitude: ride.pickup_location.coordinates[0], latitude: ride.pickup_location.coordinates[1] };
    const driverLocation = { longitude: driverLng, latitude: driverLat };
    const distance = calculateDistance(driverLocation, pickupLocation);
    return {
      ...ride.toObject(),
      customer_info: customer_info ? JSON.parse(customer_info) : null,
      distance_to_pickup: distance
    };
  }));
  return { message: 'Nearby ride requests', data: ridesWithDetails };
};

const getRideStatsByLocation = async () => {
  const stats = await Ride.aggregate([
    { $group: { _id: { lat: { $round: ['$pickup_location.coordinates.1', 2] }, lng: { $round: ['$pickup_location.coordinates.0', 2] } }, rideCount: { $sum: 1 } } },
    { $sort: { rideCount: -1 } }
  ]);
  return { message: 'Ride stats by pickup location', data: stats };
};

const acceptRide = async (ride_id, driver_id) => {
  const ride = await Ride.findOne({ ride_id });
  if (!ride) throw new CustomError('Ride not found', 404);
  if (ride.driver_id && ride.driver_id !== driver_id) throw new CustomError('Ride already accepted by another driver', 400);
  const driverData = await redisClient.get(`driver:${driver_id}`);
  if (!driverData) throw new CustomError('Driver data not available', 400);
  const driver = JSON.parse(driverData);
  if (driver.status !== 'available') throw new CustomError('Cannot accept rides while offline', 403);
  const activeRides = await Ride.find({ driver_id, status: { $in: ['accepted', 'in_progress'] } });
  if (activeRides.length > 0) throw new CustomError(`Cannot accept a new ride: active ride ${activeRides[0].ride_id}`, 400);
  if (!driver.location?.latitude || !driver.location?.longitude) throw new CustomError('Driver location not available', 400);
  const driverLocation = { longitude: driver.location.longitude, latitude: driver.location.latitude };
  const pickupLocation = { longitude: ride.pickup_location.coordinates[0], latitude: ride.pickup_location.coordinates[1] };
  const distance = calculateDistance(driverLocation, pickupLocation);
  if (distance > 16) throw new CustomError(`Too far from pickup: ${distance.toFixed(1)} km`, 400);
  const updatedRide = await Ride.findOneAndUpdate(
    { ride_id, status: 'requested', $or: [{ driver_id: null }, { driver_id }] },
    { $set: { status: 'accepted', driver_id } },
    { new: true }
  );
  if (!updatedRide) throw new CustomError('Cannot accept ride: already accepted or not requestable', 400);
  return updatedRide;
};

const startRide = async (ride_id, driver_id) => {
  const ride = await Ride.findOne({ ride_id, driver_id });
  if (!ride) throw new CustomError('Ride not found or not assigned to you', 404);
  if (ride.status !== 'accepted') throw new CustomError(`Ride is ${ride.status}, not accepted`, 400);
  const updatedRide = await Ride.findOneAndUpdate({ ride_id }, { $set: { status: 'in_progress' } }, { new: true });
  return updatedRide;
};

const completeRide = async (ride_id, driver_id) => {
  const ride = await Ride.findOne({ ride_id });
  if (!ride) throw new CustomError('Ride not found', 404);
  if (ride.driver_id !== driver_id) throw new CustomError('Ride not assigned to you', 403);
  if (ride.status !== 'in_progress') throw new CustomError(`Ride is ${ride.status}, not in progress`, 400);
  const updatedRide = await Ride.findOneAndUpdate(
    { ride_id },
    { $set: { status: 'completed' } },
    { new: true }
  );
  return updatedRide;
};

const cancelRideByCustomer = async (ride_id, customer_id, reason) => {
  const ride = await Ride.findOne({ ride_id, customer_id });
  if (!ride) throw new CustomError('Ride not found or not authorized', 404);
  if (ride.status !== 'requested' && ride.status !== 'accepted') throw new CustomError(`Cannot cancel a ride that is ${ride.status}`, 400);
  const cancellation_reason = reason === 'no_drivers_available' || reason === 'system_cancelled' ? reason : 'customer_cancelled';
  const updatedRide = await Ride.findOneAndUpdate(
    { ride_id },
    { $set: { status: 'cancelled', cancellation_reason, cancellation_time: new Date() } },
    { new: true }
  );
  return updatedRide;
};

const cancelRideByDriver = async (ride_id, driver_id, reason) => {
  const ride = await Ride.findOne({ ride_id, driver_id });
  if (!ride) throw new CustomError('Ride not found or not authorized', 404);
  if (ride.status !== 'accepted') throw new CustomError(`Cannot cancel a ride that is ${ride.status}`, 400);
  const updatedRide = await Ride.findOneAndUpdate(
    { ride_id },
    { $set: { status: 'cancelled', cancellation_reason: 'driver_cancelled', cancellation_time: new Date(), driver_id: null } },
    { new: true }
  );
  return updatedRide;
};

const rateRide = async (ride_id, user, rating, comment) => {
  if (!rating || rating < 1 || rating > 5) throw new CustomError('Rating must be between 1 and 5', 400);
  const ride = await Ride.findOne({ ride_id });
  if (!ride) throw new CustomError('Ride not found', 404);
  let ratingField;
  if (user.customer_id) {
    if (ride.customer_id !== user.customer_id) throw new CustomError('Not authorized to rate this ride', 403);
    ratingField = 'rating.customer_to_driver';
  } else if (user.driver_id) {
    if (ride.driver_id !== user.driver_id) throw new CustomError('Not authorized to rate this ride', 403);
    ratingField = 'rating.driver_to_customer';
  } else {
    throw new CustomError('Unauthorized', 403);
  }
  if (ride.status !== 'completed') throw new CustomError('Cannot rate a ride that is not completed', 400);
  const updateData = { [ratingField]: rating };
  const updatedRide = await Ride.findOneAndUpdate({ ride_id }, { $set: updateData }, { new: true });
  return updatedRide;
};

module.exports = {
  getAllRides,
  getRideById,
  createRide,
  updateRide,
  deleteRide,
  getRidesByCustomer,
  getRidesByDriver,
  getActiveRideForCustomer,
  getActiveRideForDriver,
  getNearbyRides,
  getRideStatsByLocation,
  acceptRide,
  startRide,
  completeRide,
  cancelRideByCustomer,
  cancelRideByDriver,
  rateRide
};