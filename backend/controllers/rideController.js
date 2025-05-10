const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const Customer = require('../models/Customer');
const Billing = require('../models/Billing');
const { getDynamicPrice, recordPricingData } = require('../services/pricingService');
const { 
  publishRideRequest, 
  publishRideAccepted, 
  publishRideCompleted,
  publishRideRejected,
  publishBillingCreated,
  publishPaymentProcessed
} = require('../services/messageService');
const { v4: uuidv4 } = require('uuid');
const { invalidateCache } = require('../config/redis');
const { mongoLocationToLatLng, latLngToMongoLocation } = require('../utils/locationUtils');



exports.getAllRides = async (req, res) => {
  try {
    const { limit = 100, page = 1, status, customerId, driverId, startDate, endDate } = req.query;
    
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
    
    const rides = await Ride.find(query)
      .sort({ date_time: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Ride.countDocuments(query);
    
    res.status(200).json({
      message: 'Rides retrieved successfully',
      data: rides,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error retrieving rides:', err);
    res.status(500).json({ message: 'Failed to retrieve rides' });
  }
};


exports.getRideById = async (req, res) => {
  try {
    const { ride_id } = req.params;
    
    // Find the ride
    const ride = await Ride.findOne({ ride_id });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    // Check if user is authorized to view this ride
    const isAdmin = req.user.role === 'admin';
    const isDriver = req.user.role === 'driver' && req.user.driver_id === ride.driver_id;
    const isCustomer = req.user.role === 'customer' && req.user.customer_id === ride.customer_id;
    
    if (!isAdmin && !isDriver && !isCustomer) {
      return res.status(403).json({ message: 'Unauthorized to view this ride' });
    }
    
    // Fetch driver and customer information in parallel for better performance
    const [driver_info, customer_info] = await Promise.all([
      // Only fetch driver info if a driver is assigned
      ride.driver_id 
        ? Driver.findOne({ driver_id: ride.driver_id })
            .select('driver_id first_name last_name phone car_details rating')
            .lean()
        : Promise.resolve(null),
      
      // Fetch customer info
      Customer.findOne({ customer_id: ride.customer_id })
        .select('customer_id first_name last_name phone rating')
        .lean()
    ]);
    
    // Create response with ride data and user information
    const rideResponse = {
      ...ride.toObject(),
      driver_info,
      customer_info
    };
    
    res.status(200).json({
      message: 'Ride retrieved successfully',
      data: rideResponse
    });
    
  } catch (err) {
    console.error('Error retrieving ride:', err);
    res.status(500).json({ message: 'Failed to retrieve ride' });
  }
};


exports.createRide = async (req, res) => {
  try {
    const {
      pickup_location,
      dropoff_location,
      date_time,
      passenger_count
    } = req.body;

    const customer_id = req.user.customer_id; // Extracted from JWT

    // Check if customer already has an active ride
    const activeRide = await Ride.findOne({
      customer_id,
      status: { $in: ['requested', 'accepted', 'in_progress'] }
    });

    if (activeRide) {
      return res.status(400).json({ 
        message: 'You already have an active ride. Please cancel it before booking a new one.',
        active_ride_id: activeRide.ride_id
      });
    }

    // Convert API location format to MongoDB GeoJSON format
    const pickupGeo = {
      type: 'Point',
      coordinates: [pickup_location.longitude, pickup_location.latitude]
    };
    
    const dropoffGeo = {
      type: 'Point',
      coordinates: [dropoff_location.longitude, dropoff_location.latitude]
    };

    // Generate a ride_id in SSN format
    const ride_id = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    //const customer_id = req.user.customer_id; // Extracted from JWT

    // Find nearby available drivers using proper GeoJSON query
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

    // Create ride with GeoJSON format locations
    const ride = new Ride({
      ride_id,
      pickup_location: pickupGeo,
      dropoff_location: dropoffGeo,
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

    // Update customer's ride history and location
    // Also convert the customer location to GeoJSON format
    await Customer.findOneAndUpdate(
      { customer_id },
      { 
        $push: { ride_history: ride_id },
        $set: { 
          last_location: {
            type: 'Point',
            coordinates: [pickup_location.longitude, pickup_location.latitude]
          }
        }
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
      customer_id: req.user.customer_id
    });

    if (!ride) {
      return res.status(404).json({ message: 'Ride not found or not authorized' });
    }

    const allowedUpdates = {};
    if (ride.status === 'requested') {
      if (updates.pickup_location) allowedUpdates.pickup_location = updates.pickup_location;
      if (updates.dropoff_location) allowedUpdates.dropoff_location = updates.dropoff_location;
      if (updates.passenger_count) allowedUpdates.passenger_count = updates.passenger_count;
      if (updates.date_time) allowedUpdates.date_time = new Date(updates.date_time);
      
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
    const isAdminRequest = req.user.role === 'admin';
    
    // Only allow customers to access their own rides (but allow admin access)
    if (!isAdminRequest && customer_id !== req.user.customer_id) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const rides = await Ride.find({ customer_id }).sort({ date_time: -1 });

    // Allow empty results, don't error if no rides found
    res.status(200).json({
      message: 'Rides retrieved successfully',
      count: rides.length,
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

exports.getNearbyRides = async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  const driverLat = parseFloat(latitude);
  const driverLng = parseFloat(longitude);
  const { calculateDistance } = require('../services/pricingService');

  try {
    // Find requested rides within 16km (10 miles) of the driver
    const rides = await Ride.find({
      status: 'requested',
      'pickup_location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [driverLng, driverLat]
          },
          $maxDistance: 16000 // 16km in meters (approx 10 miles)
        }
      }
    }).sort({ date_time: 1 });

    // Get customer info for each ride and add calculated distance
    const ridesWithDetails = await Promise.all(rides.map(async (ride) => {
      const customer = await Customer.findOne({ customer_id: ride.customer_id })
        .select('first_name last_name rating');
      
      // Calculate exact distance to pickup
      const pickupLocation = {
        longitude: ride.pickup_location.coordinates[0],
        latitude: ride.pickup_location.coordinates[1]
      };
      
      const driverLocation = {
        longitude: driverLng,
        latitude: driverLat
      };
      
      const distance = calculateDistance(driverLocation, pickupLocation);
      
      return {
        ...ride.toObject(),
        customer_info: customer,
        distance_to_pickup: distance // in km
      };
    }));

    res.status(200).json({
      message: 'Nearby ride requests',
      data: ridesWithDetails
    });

  } catch (err) {
    console.error('Error fetching nearby rides:', err);
    res.status(500).json({ message: 'Failed to find nearby rides' });
  }
};

exports.acceptRide = async (req, res) => {
  const { ride_id } = req.params;
  
  try {
    console.log(`Driver ${req.user.driver_id} attempting to accept ride ${ride_id}`);
    
    const driver = await Driver.findOne({ driver_id: req.user.driver_id });

    if (!driver || driver.status !== 'available') {
      return res.status(403).json({ 
        message: 'Cannot accept rides while offline. Please go online first.',
        driver_status: driver ? driver.status : 'unknown'
      });
    }


    // Check if driver already has an active ride
    const activeRides = await Ride.find({
      driver_id: req.user.driver_id,
      status: { $in: ['accepted', 'in_progress'] }
    });

    if (activeRides.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot accept a new ride while you have an active ride',
        active_ride_id: activeRides[0].ride_id
      });
    }
    
    
    const ride = await Ride.findOne({ ride_id });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    // Get driver's current location
    if (!driver.intro_media || !driver.intro_media.location || !driver.intro_media.location.coordinates) {
      return res.status(400).json({ message: 'Driver location not available' });
    }
    
    // Check if driver is within range (10 miles ≈ 16 km)
    const driverLocation = {
      longitude: driver.intro_media.location.coordinates[0],
      latitude: driver.intro_media.location.coordinates[1]
    };
    
    const pickupLocation = {
      longitude: ride.pickup_location.coordinates[0],
      latitude: ride.pickup_location.coordinates[1]
    };
    
    const { calculateDistance } = require('../services/pricingService');
    const distance = calculateDistance(driverLocation, pickupLocation);
    
    if (distance > 16) { // 10 miles in km
      return res.status(400).json({ 
        message: 'You are too far from the pickup location',
        distance: Math.round(distance * 10) / 10,
        unit: 'km'
      });
    }
    
    //  debugging to see what's happening
    console.log(`Ride status: ${ride.status}, Current driver: ${ride.driver_id}, Requesting driver: ${req.user.driver_id}`);
    
    const query = { 
      ride_id,
      status: 'requested',
      $or: [
        { driver_id: null }, 
        { driver_id: req.user.driver_id }, 
      ]
    };
    
    const updatedRide = await Ride.findOneAndUpdate(
      query,
      { 
        $set: { 
          status: 'accepted',
          driver_id: req.user.driver_id 
        } 
      },
      { new: true }
    );
    
    if (!updatedRide) {
      return res.status(400).json({ 
        message: 'Cannot accept this ride. It may be already accepted by another driver or is not in a requestable state.',
        ride_id: ride_id,
        your_id: req.user.driver_id
      });
    }
    
    // Update driver status to busy
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
    res.status(500).json({ message: 'Failed to accept ride', error: err.message });
  }
};

exports.getActiveRideForCustomer = async (req, res) => {
  const { customer_id } = req.params;
  
  try {
    // Verify authorization
    if (customer_id !== req.user.customer_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    // Find the active ride
    const activeRide = await Ride.findOne({
      customer_id,
      status: { $in: ['requested', 'accepted', 'in_progress'] }
    }).sort({ date_time: -1 });
    
    if (!activeRide) {
      return res.status(200).json({ message: 'No active ride found', data: null });
    }
    
    // Add driver information if a driver has been assigned
    let driver_info = null;
    if (activeRide.driver_id) {
      driver_info = await Driver.findOne({ driver_id: activeRide.driver_id })
        .select('driver_id first_name last_name phone car_details rating')
        .lean();
    }
    
    // Create response with ride and driver data
    const rideResponse = {
      ...activeRide.toObject(),
      driver_info
    };
    
    res.status(200).json({
      message: 'Active ride retrieved successfully',
      data: rideResponse
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
    
    // Find the active ride
    const activeRide = await Ride.findOne({
      driver_id,
      status: { $in: ['accepted', 'in_progress'] }
    }).sort({ date_time: -1 });
    
    if (!activeRide) {
      return res.status(200).json({ message: 'No active ride found', data: null });
    }
    
    // Get customer information
    const customer_info = await Customer.findOne({ customer_id: activeRide.customer_id })
      .select('customer_id first_name last_name phone rating')
      .lean();
    
    // Create response with ride and customer data
    const rideResponse = {
      ...activeRide.toObject(),
      customer_info
    };
    
    res.status(200).json({
      message: 'Active ride retrieved successfully',
      data: rideResponse
    });
  } catch (err) {
    console.error('Error retrieving active ride:', err);
    res.status(500).json({ message: 'Failed to retrieve active ride' });
  }
};

exports.completeRide = async (req, res) => {
  const { ride_id } = req.params;
  
  try {
    console.log(`Attempting to complete ride ${ride_id} by driver ${req.user.driver_id}`);
    
    const ride = await Ride.findOne({ ride_id });
    
    if (!ride) {
      console.log(`Ride ${ride_id} not found`);
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    // For debugging, log the ride status
    console.log(`Ride ${ride_id} current status: ${ride.status}`);
    
    // Check if the ride is associated with the authenticated driver
    if (req.user && req.user.driver_id && ride.driver_id !== req.user.driver_id) {
      console.log(`Ride ${ride_id} not assigned to driver ${req.user.driver_id}`);
      return res.status(403).json({ message: 'Ride not assigned to you' });
    }
    
    // Make sure the ride is in the right state
    if (ride.status !== 'in_progress') {
      console.log(`Cannot complete ride ${ride_id}: status is ${ride.status}, not in_progress`);
      return res.status(400).json({ 
        message: `Ride is ${ride.status}, not in progress`,
        current_status: ride.status 
      });
    }
    
    console.log(`Updating ride ${ride_id} status to completed`);
    
    // Update ride status to completed
    const updatedRide = await Ride.findOneAndUpdate(
      { ride_id },
      { $set: { status: 'completed' } },
      { new: true }
    );
    
    console.log(`Successfully updated ride ${ride_id} status`);
    
    // Update driver status back to available and update location
    await Driver.findOneAndUpdate(
      { driver_id: ride.driver_id },
      { 
        $set: { 
          status: 'available',
          'intro_media.location': ride.dropoff_location
        },
        $push: { ride_history: ride_id }
      }
    );
    
    console.log(`Updated driver ${ride.driver_id} status to available`);
    
    // Create bill with proper error handling
    try {
      // Generate a bill ID
      const bill_id = `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
      
      console.log(`Generating bill ${bill_id} for ride ${ride_id}`);
      
      const pickupCoords = ride.pickup_location && ride.pickup_location.coordinates 
        ? ride.pickup_location.coordinates 
        : [0, 0];
      
      const dropoffCoords = ride.dropoff_location && ride.dropoff_location.coordinates 
        ? ride.dropoff_location.coordinates 
        : [0, 0];

      // Check if bill already exists
      const existingBill = await Billing.findOne({ ride_id });
      
      if (existingBill) {
        console.log(`Bill already exists for ride ${ride_id}, skipping creation`);
        
        return res.status(200).json({
          message: 'Ride completed successfully, bill already exists',
          data: {
            ride: updatedRide,
            bill: {
              bill_id: existingBill.bill_id,
              total_amount: existingBill.total_amount,
              payment_status: existingBill.payment_status
            }
          }
        });
      }
      
      const newBill = new Billing({
        bill_id,
        date: new Date(),
        pickup_time: ride.date_time || new Date(Date.now() - 3600000),
        dropoff_time: new Date(),
        distance_covered: ride.distance || 5, 
        total_amount: ride.fare_amount || 15, 
        source_location: `${pickupCoords[1]},${pickupCoords[0]}`,
        destination_location: `${dropoffCoords[1]},${dropoffCoords[0]}`,
        driver_id: ride.driver_id,
        customer_id: ride.customer_id,
        payment_status: 'completed',
        payment_method: 'credit_card',
        ride_id,
        breakdown: {
          base_fare: 3.0,
          distance_fare: (ride.distance || 5) * 1.5,
          time_fare: (ride.duration || 15) * 0.2,
          surge_multiplier: ride.surge_factor || 1.0
        }
      });
      
      console.log('About to save bill:', newBill);
      await newBill.save();
      console.log(`Successfully created bill: ${bill_id}`);
      
      // Publish events
      await publishRideCompleted(ride_id);
      await publishBillingCreated({
        bill_id,
        date: newBill.date,
        total_amount: newBill.total_amount,
        driver_id: newBill.driver_id,
        customer_id: newBill.customer_id,
        ride_id
      });
      
      // Invalidate caches
      await invalidateCache('*rides*');
      await invalidateCache(`*driver*${ride.driver_id}*`);
      await invalidateCache(`*customer*${ride.customer_id}*`);
      await invalidateCache(`*billing*${bill_id}*`);
      
      console.log(`Sending successful response for ride ${ride_id} completion`);
      
      res.status(200).json({
        message: 'Ride completed successfully and bill created',
        data: {
          ride: updatedRide,
          bill: {
            bill_id,
            total_amount: newBill.total_amount,
            payment_status: 'completed'
          }
        }
      });
    } catch (billError) {
      console.error('Error creating bill:', billError);

      await publishPaymentProcessed(bill_id, 'completed');

      
      // Still return success for the ride completion but note the billing error
      res.status(200).json({
        message: 'Ride completed successfully but bill creation failed',
        error: billError.message,
        data: {
          ride: updatedRide
        }
      });
    }
  } catch (err) {
    console.error('Error completing ride:', err);
    res.status(500).json({ message: 'Failed to complete ride', error: err.message });
  }
};


// Customer cancels ride
exports.cancelRideByCustomer = async (req, res) => {
  const { ride_id } = req.params;
  const { reason } = req.body;
  
  try {
    // Verify this is the customer's ride
    const ride = await Ride.findOne({ 
      ride_id, 
      customer_id: req.user.customer_id 
    });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found or not authorized' });
    }
    
    // Can only cancel rides that are in requested or accepted status
    if (ride.status !== 'requested' && ride.status !== 'accepted') {
      return res.status(400).json({ 
        message: `Cannot cancel a ride that is ${ride.status}` 
      });
    }
    
    // Update ride status
    const updatedRide = await Ride.findOneAndUpdate(
      { ride_id },
      { 
        $set: { 
          status: 'cancelled',
          cancellation_reason: 'customer_cancelled',
          cancellation_time: new Date()
        } 
      },
      { new: true }
    );
    
    // If a driver was assigned, make them available again
    if (ride.driver_id) {
      await Driver.findOneAndUpdate(
        { driver_id: ride.driver_id },
        { $set: { status: 'available' } }
      );
      
      // Publish ride cancellation event
      await publishRideRejected(ride_id, ride.driver_id, 'cancelled_by_customer');
    }
    
    // Invalidate related caches
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${ride.customer_id}*`);
    if (ride.driver_id) {
      await invalidateCache(`*driver*${ride.driver_id}*`);
    }
    
    res.status(200).json({
      message: 'Ride cancelled successfully',
      data: updatedRide
    });
    
  } catch (err) {
    console.error('Error cancelling ride:', err);
    res.status(500).json({ message: 'Failed to cancel ride' });
  }
};

// Driver cancels ride
exports.cancelRideByDriver = async (req, res) => {
  const { ride_id } = req.params;
  const { reason } = req.body;
  
  try {
    // Verify this is the driver's ride
    const ride = await Ride.findOne({ 
      ride_id, 
      driver_id: req.user.driver_id 
    });
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found or not authorized' });
    }
    
    // Can only cancel rides that are in accepted status, not in_progress
    if (ride.status !== 'accepted') {
      return res.status(400).json({ 
        message: `Cannot cancel a ride that is ${ride.status}` 
      });
    }
    
    // Update ride status
    const updatedRide = await Ride.findOneAndUpdate(
      { ride_id },
      { 
        $set: { 
          status: 'cancelled',
          cancellation_reason: 'driver_cancelled',
          cancellation_time: new Date(),
          driver_id: null  // Remove driver assignment so another can accept
        } 
      },
      { new: true }
    );
    
    // Make driver available again
    await Driver.findOneAndUpdate(
      { driver_id: req.user.driver_id },
      { $set: { status: 'available' } }
    );
    
    // Publish ride cancellation event
    await publishRideRejected(ride_id, req.user.driver_id, 'cancelled_by_driver');
    
    // Invalidate related caches
    await invalidateCache('*rides*');
    await invalidateCache(`*customer*${ride.customer_id}*`);
    await invalidateCache(`*driver*${req.user.driver_id}*`);
    
    res.status(200).json({
      message: 'Ride cancelled successfully',
      data: updatedRide
    });
    
  } catch (err) {
    console.error('Error cancelling ride:', err);
    res.status(500).json({ message: 'Failed to cancel ride' });
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