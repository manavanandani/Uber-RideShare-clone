const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const Customer = require('../models/Customer');
const { getDynamicPrice } = require('../services/pricingService');
const { 
  publishRideRequest, 
  publishRideAccepted, 
  publishRideCompleted,
  publishRideRejected
} = require('../services/messageService');
const { v4: uuidv4 } = require('uuid');
const { invalidateCache } = require('../config/redis');
const { mongoLocationToLatLng, latLngToMongoLocation } = require('../utils/locationUtils');

// Test controller
// Add to your rideController.js file

// Test create ride
exports.createTestRide = async (req, res) => {
  try {
    const {
      pickup_location,
      dropoff_location,
      date_time,
      passenger_count,
      driver_id,
      customer_id
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({ message: 'customer_id is required for test rides' });
    }

    // Generate a ride_id in SSN format
    const ride_id = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Calculate fare using the dynamic pricing algorithm
    const priceData = await getDynamicPrice(
      pickup_location, 
      dropoff_location,
      new Date(date_time || Date.now()),
      passenger_count || 1
    );

    const ride = new Ride({
      ride_id,
      pickup_location,
      dropoff_location,
      date_time: new Date(date_time || Date.now()),
      customer_id,
      driver_id, // This might be null if not provided
      fare_amount: priceData.fare,
      passenger_count: passenger_count || 1,
      distance: priceData.distance,
      duration: priceData.duration,
      status: 'requested'
    });

    const savedRide = await ride.save();

    // Update customer's ride history
    await Customer.findOneAndUpdate(
      { customer_id },
      { $push: { ride_history: ride_id } }
    );

    // Publish the ride request to Kafka
    await publishRideRequest({
      ride_id: savedRide.ride_id,
      pickup_location: savedRide.pickup_location,
      dropoff_location: savedRide.dropoff_location,
      date_time: savedRide.date_time,
      customer_id: savedRide.customer_id,
      driver_id: savedRide.driver_id,
      passenger_count: savedRide.passenger_count,
      fare_amount: savedRide.fare_amount
    });

    // Invalidate related caches
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${customer_id}*`);
    if (driver_id) {
      await invalidateCache(`*driver*${driver_id}*`);
    }

    res.status(201).json({
      message: 'Test ride created successfully',
      data: savedRide
    });
  } catch (err) {
    console.error('Error creating test ride:', err);
    res.status(500).json({ message: 'Failed to create test ride' });
  }
};

// Test accept ride
exports.testAcceptRide = async (req, res) => {
  const { ride_id } = req.params;
  const { driver_id } = req.body;
  
  try {
    if (!driver_id) {
      return res.status(400).json({ message: 'driver_id is required' });
    }
    
    const ride = await Ride.findOne({ ride_id });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    if (ride.status !== 'requested') {
      return res.status(400).json({ message: `Ride is already ${ride.status}` });
    }
    
    const updatedRide = await Ride.findOneAndUpdate(
      { ride_id },
      { $set: { status: 'accepted', driver_id: driver_id } },
      { new: true }
    );
    
    // Update driver status
    await Driver.findOneAndUpdate(
      { driver_id },
      { $set: { status: 'busy' } }
    );
    
    // Publish event
    await publishRideAccepted(ride_id, driver_id);
    
    // Invalidate caches
    await invalidateCache('*rides*');
    await invalidateCache(`*driver*${driver_id}*`);
    
    res.status(200).json({
      message: 'Test ride accepted successfully',
      data: updatedRide
    });
  } catch (err) {
    console.error('Error accepting test ride:', err);
    res.status(500).json({ message: 'Failed to accept test ride' });
  }
};

// Test start ride
exports.testStartRide = async (req, res) => {
  const { ride_id } = req.params;
  
  try {
    const ride = await Ride.findOne({ ride_id });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: `Ride is ${ride.status}, not accepted` });
    }
    
    const updatedRide = await Ride.findOneAndUpdate(
      { ride_id },
      { $set: { status: 'in_progress' } },
      { new: true }
    );
    
    // Invalidate caches
    await invalidateCache('*rides*');
    await invalidateCache(`*driver*${ride.driver_id}*`);
    await invalidateCache(`*customer*${ride.customer_id}*`);
    
    res.status(200).json({
      message: 'Test ride started successfully',
      data: updatedRide
    });
  } catch (err) {
    console.error('Error starting test ride:', err);
    res.status(500).json({ message: 'Failed to start test ride' });
  }
};

// Test complete ride
exports.testCompleteRide = async (req, res) => {
  const { ride_id } = req.params;
  
  try {
    const ride = await Ride.findOne({ ride_id });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    if (ride.status !== 'in_progress') {
      return res.status(400).json({ message: `Ride is ${ride.status}, not in progress` });
    }
    
    const updatedRide = await Ride.findOneAndUpdate(
      { ride_id },
      { $set: { status: 'completed' } },
      { new: true }
    );
    
    // Update driver status back to available
    await Driver.findOneAndUpdate(
      { driver_id: ride.driver_id },
      { $set: { status: 'available' } }
    );
    
    // Add ride to driver's history
    await Driver.findOneAndUpdate(
      { driver_id: ride.driver_id },
      { $push: { ride_history: ride_id } }
    );
    
    // Publish event
    await publishRideCompleted(ride_id);
    
    // Invalidate caches
    await invalidateCache('*rides*');
    await invalidateCache(`*driver*${ride.driver_id}*`);
    await invalidateCache(`*customer*${ride.customer_id}*`);
    
    res.status(200).json({
      message: 'Test ride completed successfully',
      data: updatedRide
    });
  } catch (err) {
    console.error('Error completing test ride:', err);
    res.status(500).json({ message: 'Failed to complete test ride' });
  }
};

// test controller ends here


exports.createRide = async (req, res) => {
  try {
    const {
      pickup_location,
      dropoff_location,
      date_time,
      passenger_count
    } = req.body;

    // Generate a ride_id in SSN format
    const ride_id = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    const customer_id = req.user.customer_id; // Extracted from JWT

    // Find nearby available drivers
    const nearbyDrivers = await Driver.find({
      'intro_media.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [pickup_location.longitude, pickup_location.latitude]
          },
          $maxDistance: 10000 // 10km in meters
        }
      },
      status: 'available'
    }).limit(5);

    // If no drivers are available, still create the ride but leave it in "requested" state
    let driver_id = null;
    if (nearbyDrivers.length > 0) {
      // Select the closest driver
      const driver = nearbyDrivers[0];
      driver_id = driver.driver_id;
    }

    // Calculate fare using the dynamic pricing algorithm
    const priceData = await getDynamicPrice(
      pickup_location, 
      dropoff_location,
      new Date(date_time),
      passenger_count || 1
    );

    const ride = new Ride({
      ride_id,
      pickup_location,
      dropoff_location,
      date_time: new Date(date_time || Date.now()),
      customer_id,
      driver_id, // This might be null if no drivers are available
      fare_amount: priceData.fare,
      passenger_count: passenger_count || 1,
      distance: priceData.distance,
      duration: priceData.duration,
      surge_factor: priceData.surge_factor || 1.0,
      status: 'requested'
    });

    const savedRide = await ride.save();

    await recordPricingData(savedRide);


    // Update customer's ride history
    await Customer.findOneAndUpdate(
      { customer_id },
      { 
        $push: { ride_history: ride_id },
        $set: { last_location: pickup_location }
      }
    );

    // Publish the ride request to Kafka
    await publishRideRequest({
      ride_id: savedRide.ride_id,
      pickup_location: savedRide.pickup_location,
      dropoff_location: savedRide.dropoff_location,
      date_time: savedRide.date_time,
      customer_id: savedRide.customer_id,
      driver_id: savedRide.driver_id,
      passenger_count: savedRide.passenger_count,
      fare_amount: savedRide.fare_amount
    });

    // Invalidate related caches
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${customer_id}*`);
    if (driver_id) {
      await invalidateCache(`*driver*${driver_id}*`);
    }

    res.status(201).json({
      message: 'Ride created successfully',
      data: savedRide
    });

  } catch (err) {
    console.error('Error creating ride:', err);
    res.status(500).json({ message: 'Failed to create ride' });
  }
};

exports.updateRide = async (req, res) => {
  const { ride_id } = req.params;
  const updates = req.body;

  try {
    // Ensure the user can only update own rides
    const ride = await Ride.findOne({ 
      ride_id,
      customer_id: req.user.customer_id // Ensure the customer owns this ride
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found or not authorized' });
    }

    // Only allow updates to certain fields based on the ride status
    const allowedUpdates = {};
    if (ride.status === 'requested') {
      // Allow changes to pickup, dropoff, passengers, etc. before a ride is accepted
      if (updates.pickup_location) allowedUpdates.pickup_location = updates.pickup_location;
      if (updates.dropoff_location) allowedUpdates.dropoff_location = updates.dropoff_location;
      if (updates.passenger_count) allowedUpdates.passenger_count = updates.passenger_count;
      if (updates.date_time) allowedUpdates.date_time = new Date(updates.date_time);
      
      // Recalculate fare if location or passenger count changed
      if (updates.pickup_location || updates.dropoff_location || updates.passenger_count) {
        const priceData = await getDynamicPrice(
          updates.pickup_location || ride.pickup_location,
          updates.dropoff_location || ride.dropoff_location,
          updates.date_time ? new Date(updates.date_time) : ride.date_time,
          updates.passenger_count || ride.passenger_count
        );
        
        allowedUpdates.fare_amount = priceData.fare;
        allowedUpdates.distance = priceData.distance;
        allowedUpdates.duration = priceData.duration;
      }
    } else if (ride.status === 'completed' && updates.rating) {
      // Allow customer to rate the driver after ride is completed
      allowedUpdates['rating.customer_to_driver'] = updates.rating;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided or ride cannot be updated in its current state' });
    }

    const updatedRide = await Ride.findOneAndUpdate(
      { ride_id },
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );

    // Invalidate related caches
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${ride.customer_id}*`);
    await invalidateCache(`*driver*${ride.driver_id}*`);

    res.status(200).json({
      message: 'Ride updated successfully',
      data: updatedRide
    });

  } catch (err) {
    console.error('Error updating ride:', err);
    res.status(500).json({ message: 'Failed to update ride' });
  }
};

exports.deleteRide = async (req, res) => {
  const { ride_id } = req.params;

  try {
    const ride = await Ride.findOne({
      ride_id,
      customer_id: req.user.customer_id // only allowing deletion of own rides
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found or not authorized to delete' });
    }

    // Only allow deletion of rides that haven't started yet
    if (ride.status !== 'requested') {
      return res.status(400).json({ message: 'Cannot delete a ride that has already been accepted or completed' });
    }

    await Ride.findOneAndDelete({ ride_id });

    // Publish ride cancellation event
    await publishRideRejected(ride_id, ride.driver_id, 'cancelled_by_customer');

    // Invalidate related caches
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${ride.customer_id}*`);
    await invalidateCache(`*driver*${ride.driver_id}*`);

    res.status(200).json({ message: 'Ride deleted successfully' });

  } catch (err) {
    console.error('Error deleting ride:', err);
    res.status(500).json({ message: 'Failed to delete ride' });
  }
};

exports.getRidesByCustomer = async (req, res) => {
  const { customer_id } = req.params;

  try {
    // Only allow customers to access their own rides
    if (customer_id !== req.user.customer_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const rides = await Ride.find({ customer_id }).sort({ date_time: -1 });

    res.status(200).json({
      message: 'Rides retrieved successfully',
      data: rides
    });

  } catch (err) {
    console.error('Error fetching customer rides:', err);
    res.status(500).json({ message: 'Failed to retrieve rides' });
  }
};

exports.getRidesByDriver = async (req, res) => {
  const { driver_id } = req.params;

  try {
    // Only allow drivers to access their own rides
    if (driver_id !== req.user.driver_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const rides = await Ride.find({ driver_id }).sort({ date_time: -1 });

    res.status(200).json({
      message: 'Rides retrieved successfully',
      data: rides
    });

  } catch (err) {
    console.error('Error fetching driver rides:', err);
    res.status(500).json({ message: 'Failed to retrieve rides' });
  }
};

exports.getRideStatsByLocation = async (req, res) => {
  try {
    const stats = await Ride.aggregate([
      {
        $group: {
          _id: {
            lat: { $round: ['$pickup_location.latitude', 2] },
            lng: { $round: ['$pickup_location.longitude', 2] }
          },
          rideCount: { $sum: 1 }
        }
      },
      {
        $sort: { rideCount: -1 }
      }
    ]);

    res.status(200).json({
      message: 'Ride stats by pickup location',
      data: stats
    });

  } catch (err) {
    console.error('Error fetching ride stats:', err);
    res.status(500).json({ message: 'Failed to fetch ride stats' });
  }
};

// Add to rideController.js
exports.getNearbyRides = async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  const driverLat = parseFloat(latitude);
  const driverLng = parseFloat(longitude);

  try {
    // Find requested rides within 10km of the driver
    const rides = await Ride.find({
      status: 'requested',
      'pickup_location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [driverLng, driverLat]
          },
          $maxDistance: 10000 // 10km in meters
        }
      }
    }).sort({ date_time: 1 }); // Sort by time, most immediate first

    // Get customer info for each ride
    const ridesWithCustomerInfo = await Promise.all(rides.map(async (ride) => {
      const customer = await Customer.findOne({ customer_id: ride.customer_id })
        .select('first_name last_name rating');
      
      return {
        ...ride.toObject(),
        customer_info: customer
      };
    }));

    res.status(200).json({
      message: 'Nearby ride requests',
      data: ridesWithCustomerInfo
    });

  } catch (err) {
    console.error('Error fetching nearby rides:', err);
    res.status(500).json({ message: 'Failed to find nearby rides' });
  }
};

exports.acceptRide = async (req, res) => {
  const { ride_id } = req.params;
  
  try {
    const ride = await Ride.findOne({ 
      ride_id,
      driver_id: req.user.driver_id
    });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found or not assigned to you' });
    }
    
    if (ride.status !== 'requested') {
      return res.status(400).json({ message: `Ride is already ${ride.status}` });
    }
    
    const updatedRide = await Ride.findOneAndUpdate(
      { ride_id },
      { $set: { status: 'accepted' } },
      { new: true }
    );
    
    // Update driver status
    await Driver.findOneAndUpdate(
      { driver_id: req.user.driver_id },
      { $set: { status: 'busy' } }
    );
    
    // Publish event
    await publishRideAccepted(ride_id, req.user.driver_id);
    
    // Invalidate caches
    await invalidateCache('*rides*');
    await invalidateCache(`*driver*${req.user.driver_id}*`);
    
    res.status(200).json({
      message: 'Ride accepted successfully',
      data: updatedRide
    });
    
  } catch (err) {
    console.error('Error accepting ride:', err);
    res.status(500).json({ message: 'Failed to accept ride' });
  }
};

exports.getActiveRideForCustomer = async (req, res) => {
  const { customer_id } = req.params;
  
  try {
    // Verify authorization
    if (customer_id !== req.user.customer_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Find the active ride (either accepted or in_progress)
    const activeRide = await Ride.findOne({
      customer_id,
      status: { $in: ['requested', 'accepted', 'in_progress'] }
    }).sort({ date_time: -1 });
    
    if (!activeRide) {
      return res.status(404).json({ message: 'No active ride found' });
    }
    
    res.status(200).json({
      message: 'Active ride retrieved successfully',
      data: activeRide
    });
  } catch (err) {
    console.error('Error retrieving active ride:', err);
    res.status(500).json({ message: 'Failed to retrieve active ride' });
  }
};

exports.getActiveRideForDriver = async (req, res) => {
  const { driver_id } = req.params;
  
  try {
    // Verify authorization
    if (driver_id !== req.user.driver_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Find the active ride (either accepted or in_progress)
    const activeRide = await Ride.findOne({
      driver_id,
      status: { $in: ['accepted', 'in_progress'] }
    }).sort({ date_time: -1 });
    
    if (!activeRide) {
      return res.status(404).json({ message: 'No active ride found' });
    }
    
    res.status(200).json({
      message: 'Active ride retrieved successfully',
      data: activeRide
    });
  } catch (err) {
    console.error('Error retrieving active ride:', err);
    res.status(500).json({ message: 'Failed to retrieve active ride' });
  }
};

exports.completeRide = async (req, res) => {
  const { ride_id } = req.params;
  
  try {
    const ride = await Ride.findOne({ 
      ride_id,
      driver_id: req.user.driver_id
    });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found or not assigned to you' });
    }
    
    if (ride.status !== 'in_progress') {
      return res.status(400).json({ message: `Ride is ${ride.status}, not in progress` });
    }
    
    const updatedRide = await Ride.findOneAndUpdate(
      { ride_id },
      { $set: { status: 'completed' } },
      { new: true }
    );
    
    // Update driver status back to available
    await Driver.findOneAndUpdate(
      { driver_id: req.user.driver_id },
      { $set: { status: 'available' } }
    );
    
    // Add ride to driver's history
    await Driver.findOneAndUpdate(
      { driver_id: req.user.driver_id },
      { $push: { ride_history: ride_id } }
    );
    
    // Publish event
    await publishRideCompleted(ride_id);
    
    // Invalidate caches
    await invalidateCache('*rides*');
    await invalidateCache(`*driver*${req.user.driver_id}*`);
    await invalidateCache(`*customer*${ride.customer_id}*`);
    
    res.status(200).json({
      message: 'Ride completed successfully',
      data: updatedRide
    });
    
  } catch (err) {
    console.error('Error completing ride:', err);
    res.status(500).json({ message: 'Failed to complete ride' });
  }
};

exports.startRide = async (req, res) => {
    const { ride_id } = req.params;
    
    try {
      const ride = await Ride.findOne({ 
        ride_id,
        driver_id: req.user.driver_id
      });
      
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found or not assigned to you' });
      }
      
      if (ride.status !== 'accepted') {
        return res.status(400).json({ message: `Ride is ${ride.status}, not accepted` });
      }
      
      const updatedRide = await Ride.findOneAndUpdate(
        { ride_id },
        { $set: { status: 'in_progress' } },
        { new: true }
      );
      
      // Invalidate caches
      await invalidateCache('*rides*');
      await invalidateCache(`*driver*${req.user.driver_id}*`);
      await invalidateCache(`*customer*${ride.customer_id}*`);
      
      res.status(200).json({
        message: 'Ride started successfully',
        data: updatedRide
      });
      
    } catch (err) {
      console.error('Error starting ride:', err);
      res.status(500).json({ message: 'Failed to start ride' });
    }
  };
  
  exports.rateRide = async (req, res) => {
    const { ride_id } = req.params;
    const { rating, comment } = req.body;
    
    try {
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      
      let ride;
      let ratingField;
      
      // Check if request is from customer or driver
      if (req.user.customer_id) {
        ride = await Ride.findOne({ ride_id, customer_id: req.user.customer_id });
        ratingField = 'rating.customer_to_driver';
      } else if (req.user.driver_id) {
        ride = await Ride.findOne({ ride_id, driver_id: req.user.driver_id });
        ratingField = 'rating.driver_to_customer';
      } else {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found or not associated with your account' });
      }
      
      if (ride.status !== 'completed') {
        return res.status(400).json({ message: 'Cannot rate a ride that is not completed' });
      }
      
      // Update ride rating
      const updateData = {};
      updateData[ratingField] = rating;
      
      const updatedRide = await Ride.findOneAndUpdate(
        { ride_id },
        { $set: updateData },
        { new: true }
      );
      
      // Also add review to the other party
      if (req.user.customer_id) {
        // Customer rating driver
        await Driver.findOneAndUpdate(
          { driver_id: ride.driver_id },
          { 
            $push: { 
              reviews: {
                ride_id,
                customer_id: req.user.customer_id,
                rating,
                comment: comment || '',
                date: new Date()
              } 
            },
            $set: { 
              rating: await calculateDriverAverageRating(ride.driver_id, rating) 
            }
          }
        );
      } else {
        // Driver rating customer
        await Customer.findOneAndUpdate(
          { customer_id: ride.customer_id },
          { 
            $push: { 
              reviews: {
                driver_id: req.user.driver_id,
                rating,
                comment: comment || '',
                date: new Date()
              } 
            },
            $set: { 
              rating: await calculateCustomerAverageRating(ride.customer_id, rating) 
            }
          }
        );
      }
      
      // Invalidate caches
      await invalidateCache('*rides*');
      await invalidateCache(`*driver*${ride.driver_id}*`);
      await invalidateCache(`*customer*${ride.customer_id}*`);
      
      res.status(200).json({
        message: 'Ride rated successfully',
        data: updatedRide
      });
      
    } catch (err) {
      console.error('Error rating ride:', err);
      res.status(500).json({ message: 'Failed to rate ride' });
    }
  };
  
  // Helper functions for rating
  async function calculateDriverAverageRating(driver_id, newRating) {
    const driver = await Driver.findOne({ driver_id });
    const reviewCount = driver.reviews.length;
    
    // If this is the first review, return the rating as is
    if (reviewCount === 0) {
      return newRating;
    }
    
    // Calculate new average including the new rating
    const totalRating = driver.reviews.reduce((acc, rev) => acc + rev.rating, 0) + newRating;
    return (totalRating / (reviewCount + 1)).toFixed(1);
  }
  
  async function calculateCustomerAverageRating(customer_id, newRating) {
    const customer = await Customer.findOne({ customer_id });
    const reviewCount = customer.reviews.length;
    
    // If this is the first review, return the rating as is
    if (reviewCount === 0) {
      return newRating;
    }
    
    // Calculate new average including the new rating
    const totalRating = customer.reviews.reduce((acc, rev) => acc + rev.rating, 0) + newRating;
    return (totalRating / (reviewCount + 1)).toFixed(1);
  }