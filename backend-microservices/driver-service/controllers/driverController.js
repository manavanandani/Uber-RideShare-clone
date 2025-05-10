const Driver = require('../models/Driver');
const { publishDriverStatusChange } = require('../services/messageService');
const { invalidateCache } = require('../config/redis');
const { mongoLocationToLatLng, latLngToMongoLocation } = require('../utils/locationUtils');
const { geocodeAddress } = require('../utils/locationUtils');


// Get all drivers
exports.getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().select('-password');
    
    res.status(200).json({
      message: 'Drivers retrieved successfully',
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    console.error('Error retrieving drivers:', error);
    res.status(500).json({ message: 'Failed to retrieve drivers' });
  }
};

// Get available drivers
exports.getAvailableDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ status: 'available' })
      .select('driver_id first_name last_name car_details intro_media.location rating');
    
    res.status(200).json({
      message: 'Available drivers retrieved successfully',
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    console.error('Error getting available drivers:', error);
    res.status(500).json({ message: 'Failed to get available drivers' });
  }
};


// Get single driver by ID
exports.getDriverById = async (req, res) => {
  const { driver_id } = req.params;
  
  try {
    const driver = await Driver.findOne({ driver_id }).select('-password');
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.status(200).json({
      message: 'Driver retrieved successfully',
      data: driver
    });
  } catch (error) {
    console.error('Error retrieving driver:', error);
    res.status(500).json({ message: 'Failed to retrieve driver' });
  }
};

// Create a new driver
exports.createDriver = async (req, res) => {
  try {
    // Check if driver with the same ID or email exists
    const existingDriver = await Driver.findOne({
      $or: [
        { driver_id: req.body.driver_id },
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });
    
    if (existingDriver) {
      return res.status(400).json({
        message: 'Driver already exists with this ID, email, or phone number'
      });
    }
    
    // Validate SSN format for driver_id
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(req.body.driver_id)) {
      return res.status(400).json({
        message: 'Invalid driver_id format. Must be XXX-XX-XXXX'
      });
    }
    
    // Validate ZIP code
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(req.body.zip_code)) {
      return res.status(400).json({
        message: 'Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX'
      });
    }
    
    const driver = new Driver(req.body);
    await driver.save();
    
    // Invalidate any relevant caches
    await invalidateCache('drivers:all');
    
    // Publish driver creation event
    await publishDriverStatusChange(
      driver.driver_id,
      'created',
      driver.intro_media?.location || null
    );
    
    res.status(201).json({
      message: 'Driver created successfully',
      data: driver
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({
      message: 'Failed to create driver',
      error: error.message
    });
  }
};

// Update a driver
exports.updateDriver = async (req, res) => {
  const { driver_id } = req.params;
  
  try {
    // If updating email or phone, check if they're already in use
    if (req.body.email || req.body.phone) {
      const existingDriver = await Driver.findOne({
        $or: [
          { email: req.body.email, driver_id: { $ne: driver_id } },
          { phone: req.body.phone, driver_id: { $ne: driver_id } }
        ]
      });
      
      if (existingDriver) {
        return res.status(400).json({
          message: 'Email or phone number already in use by another driver'
        });
      }
    }
    
    // Validate ZIP code if provided
    if (req.body.zip_code) {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(req.body.zip_code)) {
        return res.status(400).json({
          message: 'Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX'
        });
      }
    }
    
    const driver = await Driver.findOneAndUpdate(
      { driver_id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Invalidate any relevant caches
    await invalidateCache(`drivers:${driver_id}`);
    await invalidateCache('drivers:all');
    
    // Publish driver update event
    await publishDriverStatusChange(
      driver.driver_id,
      'updated',
      driver.intro_media?.location || null
    );
    
    res.status(200).json({
      message: 'Driver updated successfully',
      data: driver
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      message: 'Failed to update driver',
      error: error.message
    });
  }
};

// Delete a driver
exports.deleteDriver = async (req, res) => {
  const { driver_id } = req.params;
  
  try {
    const driver = await Driver.findOneAndDelete({ driver_id });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Invalidate any relevant caches
    await invalidateCache(`drivers:${driver_id}`);
    await invalidateCache('drivers:all');
    
    // Publish driver deletion event
    await publishDriverStatusChange(driver_id, 'deleted', null);
    
    res.status(200).json({
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      message: 'Failed to delete driver',
      error: error.message
    });
  }
};

// Search drivers
exports.searchDrivers = async (req, res) => {
  try {
    const {
      name,
      city,
      state,
      min_rating,
      max_rating
    } = req.query;
    
    const query = {};
    
    if (name) {
      query.$or = [
        { first_name: { $regex: name, $options: 'i' } },
        { last_name: { $regex: name, $options: 'i' } }
      ];
    }
    
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    
    if (state) {
      query.state = state.toUpperCase();
    }
    
    if (min_rating || max_rating) {
      query.rating = {};
      if (min_rating) {
        query.rating.$gte = parseFloat(min_rating);
      }
      if (max_rating) {
        query.rating.$lte = parseFloat(max_rating);
      }
    }
    
    const drivers = await Driver.find(query).select('-password');
    
    res.status(200).json({
      message: 'Search results',
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    console.error('Error searching drivers:', error);
    res.status(500).json({
      message: 'Failed to search drivers',
      error: error.message
    });
  }
};

// Update driver location and status
exports.updateDriverStatus = async (req, res) => {
  const { driver_id } = req.params;
  const { status, latitude, longitude } = req.body;
  
  try {
    // Validate inputs
    if (!status || !['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const updateObj = { status };

    if (latitude && longitude) {
      updateObj['intro_media.location'] = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }
    
    const driver = await Driver.findOneAndUpdate(
      { driver_id },
      { $set: updateObj },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Invalidate relevant caches
    await invalidateCache(`drivers:${driver_id}`);
    await invalidateCache('drivers:available');
    
    // Publish driver status change event
    await publishDriverStatusChange(
      driver_id,
      status,
      latitude && longitude ? { latitude, longitude } : null
    );
    
    res.status(200).json({
      message: 'Driver status updated successfully',
      data: {
        driver_id,
        status: driver.status,
        location: latitude && longitude ? { latitude, longitude } : null
      }
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({
      message: 'Failed to update driver status',
      error: error.message
    });
  }
};

// Upload driver introduction media
exports.uploadDriverMedia = async (req, res) => {
  const { driver_id } = req.params;
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/api/media/${req.file.filename}`;
    
    // Determine if it's an image or video
    const isVideo = req.file.mimetype.startsWith('video/');
    const updateField = isVideo ? 'intro_media.video_url' : 'intro_media.image_urls';
    
    let updateOperation;
    if (isVideo) {
      // For video, just replace the URL
      updateOperation = { $set: { [updateField]: fileUrl } };
    } else {
      // For images, add to the array
      updateOperation = { $push: { [updateField]: fileUrl } };
    }
    
    const driver = await Driver.findOneAndUpdate(
      { driver_id },
      updateOperation,
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Invalidate cache
    await invalidateCache(`drivers:${driver_id}`);
    
    res.status(200).json({
      message: 'Media uploaded successfully',
      data: {
        driver_id,
        intro_media: driver.intro_media
      }
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({
      message: 'Failed to upload media',
      error: error.message
    });
  }
};

// Get driver reviews
exports.getDriverReviews = async (req, res) => {
  const { driver_id } = req.params;
  
  try {
    const driver = await Driver.findOne({ driver_id }).select('reviews');
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.status(200).json({
      message: 'Driver reviews retrieved successfully',
      count: driver.reviews.length,
      data: driver.reviews
    });
  } catch (error) {
    console.error('Error retrieving driver reviews:', error);
    res.status(500).json({
      message: 'Failed to retrieve driver reviews',
      error: error.message
    });
  }
};


exports.updateDriverAddress = async (req, res) => {
  const { driver_id } = req.params;
  const { address, city, state, zip_code } = req.body;
  
  try {
    // Construct full address
    const fullAddress = `${address}, ${city}, ${state} ${zip_code}`;
    
    // Geocode the address
    const coordinates = await geocodeAddress(fullAddress);
    
    if (!coordinates) {
      return res.status(400).json({ 
        message: 'Could not geocode the provided address' 
      });
    }
    
    // Update driver's address and location
    const driver = await Driver.findOneAndUpdate(
      { driver_id },
      { 
        $set: { 
          address,
          city,
          state,
          zip_code,
          'intro_media.location': {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude]
          }
        } 
      },
      { new: true }
    );
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Invalidate any relevant caches
    await invalidateCache(`drivers:${driver_id}`);
    await invalidateCache('drivers:all');
    
    // Publish driver update event with new location
    await publishDriverStatusChange(
      driver.driver_id,
      driver.status,
      coordinates
    );
    
    res.status(200).json({
      message: 'Driver address and location updated successfully',
      data: {
        driver_id,
        address: fullAddress,
        location: coordinates
      }
    });
  } catch (error) {
    console.error('Error updating driver address:', error);
    res.status(500).json({
      message: 'Failed to update driver address',
      error: error.message
    });
  }
};

module.exports = exports;