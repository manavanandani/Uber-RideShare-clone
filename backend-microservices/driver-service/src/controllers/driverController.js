const { Driver } = require('../model/driver');
const { sendMessage } = require('../kafka/driverEventProducer');
const { KAFKA_TOPICS } = require('../../../shared/kafka/config');
const { invalidateCache } = require('../config/redis');
const { mongoLocationToLatLng, latLngToMongoLocation, geocodeAddress } = require('../utils/locationUtils');
const { CustomError } = require('../../../shared/utils/errors');
const driverService = require('../services/driverService');

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
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
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
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Get single driver by ID
exports.getDriverById = async (req, res) => {
  const { driver_id } = req.params;
  try {
    const driver = await Driver.findOne({ driver_id }).select('-password');
    if (!driver) {
      throw new CustomError('Driver not found', 404);
    }
    res.status(200).json({
      message: 'Driver retrieved successfully',
      data: driver
    });
  } catch (error) {
    console.error('Error retrieving driver:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Create a new driver
exports.createDriver = async (req, res) => {
  try {
    await driverService.validateDriverData(req.body);
    const driver = new Driver({
      ...req.body,
      status: 'offline'
    });
    await driver.save();
    await invalidateCache('drivers:all');
    await sendMessage({
      topic: KAFKA_TOPICS.DRIVER_EVENTS,
      message: {
        driver_id: driver.driver_id,
        event_type: 'DRIVER_CREATED',
        data: {
          name: `${driver.first_name} ${driver.last_name}`,
          location: driver.intro_media?.location || null
        }
      }
    });
    const responseDriver = driver.toObject();
    delete responseDriver.password;
    res.status(201).json({
      message: 'Driver created successfully',
      data: responseDriver
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Update a driver
exports.updateDriver = async (req, res) => {
  const { driver_id } = req.params;
  try {
    await driverService.validateDriverUpdate(req.body, driver_id);
    const driver = await Driver.findOneAndUpdate(
      { driver_id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!driver) {
      throw new CustomError('Driver not found', 404);
    }
    await invalidateCache(`drivers:${driver_id}`);
    await invalidateCache('drivers:all');
    await sendMessage({
      topic: KAFKA_TOPICS.DRIVER_EVENTS,
      message: {
        driver_id: driver.driver_id,
        event_type: 'DRIVER_UPDATED',
        data: {
          name: `${driver.first_name} ${driver.last_name}`,
          location: driver.intro_media?.location || null
        }
      }
    });
    const responseDriver = driver.toObject();
    delete responseDriver.password;
    res.status(200).json({
      message: 'Driver updated successfully',
      data: responseDriver
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Delete a driver
exports.deleteDriver = async (req, res) => {
  const { driver_id } = req.params;
  try {
    const driver = await Driver.findOneAndDelete({ driver_id });
    if (!driver) {
      throw new CustomError('Driver not found', 404);
    }
    await invalidateCache(`drivers:${driver_id}`);
    await invalidateCache('drivers:all');
    await sendMessage({
      topic: KAFKA_TOPICS.DRIVER_EVENTS,
      message: {
        driver_id: driver_id,
        event_type: 'DRIVER_DELETED',
        data: { name: `${driver.first_name} ${driver.last_name}` }
      }
    });
    res.status(200).json({
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Search drivers
exports.searchDrivers = async (req, res) => {
  try {
    const query = {};
    const { name, city, state, min_rating, max_rating } = req.query;
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
      if (min_rating) query.rating.$gte = parseFloat(min_rating);
      if (max_rating) query.rating.$lte = parseFloat(max_rating);
    }
    const drivers = await Driver.find(query).select('-password');
    res.status(200).json({
      message: 'Search results',
      count: drivers.length,
      data: drivers
    });
  } catch (error) {
    console.error('Error searching drivers:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Update driver location and status
exports.updateDriverStatus = async (req, res) => {
  const { driver_id } = req.params;
  const { status, latitude, longitude } = req.body;
  try {
    if (!status || !['available', 'busy', 'offline'].includes(status)) {
      throw new CustomError('Invalid status value', 400);
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
      throw new CustomError('Driver not found', 404);
    }
    await invalidateCache(`drivers:${driver_id}`);
    await invalidateCache('drivers:available');
    await sendMessage({
      topic: KAFKA_TOPICS.DRIVER_EVENTS,
      message: {
        driver_id: driver_id,
        event_type: 'DRIVER_STATUS_UPDATED',
        data: {
          status,
          location: latitude && longitude ? { latitude, longitude } : null
        }
      }
    });
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
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Upload driver introduction media
exports.uploadDriverMedia = async (req, res) => {
  try {
    if (!req.file) {
      throw new CustomError('No file uploaded', 400);
    }
    const fileUrl = `/api/driver/media/${req.file.filename}`;
    const isVideo = req.file.mimetype.startsWith('video/');
    const updateField = isVideo ? 'intro_media.video_url' : 'intro_media.image_urls';
    const updateOperation = isVideo
      ? { $set: { [updateField]: fileUrl } }
      : { $push: { 'intro_media.image_urls': { $each: [fileUrl], $position: 0 } } };
    const driver = await Driver.findOneAndUpdate(
      { driver_id: req.params.driver_id },
      updateOperation,
      { new: true }
    );
    if (!driver) {
      throw new CustomError('Driver not found', 404);
    }
    res.status(200).json({
      message: 'Media uploaded successfully',
      data: {
        driver_id: req.params.driver_id,
        intro_media: driver.intro_media
      }
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Get driver reviews
exports.getDriverReviews = async (req, res) => {
  const { driver_id } = req.params;
  try {
    const driver = await Driver.findOne({ driver_id }).select('reviews');
    if (!driver) {
      throw new CustomError('Driver not found', 404);
    }
    res.status(200).json({
      message: 'Driver reviews retrieved successfully',
      count: driver.reviews.length,
      data: driver.reviews
    });
  } catch (error) {
    console.error('Error retrieving driver reviews:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Update driver address
exports.updateDriverAddress = async (req, res) => {
  const { driver_id } = req.params;
  const { address, city, state, zip_code } = req.body;
  try {
    const fullAddress = `${address}, ${city}, ${state} ${zip_code}`;
    const coordinates = await geocodeAddress(fullAddress);
    if (!coordinates) {
      throw new CustomError('Could not geocode the provided address', 400);
    }
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
      throw new CustomError('Driver not found', 404);
    }
    await invalidateCache(`drivers:${driver_id}`);
    await invalidateCache('drivers:all');
    await sendMessage({
      topic: KAFKA_TOPICS.DRIVER_EVENTS,
      message: {
        driver_id,
        event_type: 'DRIVER_ADDRESS_UPDATED',
        data: {
          name: `${driver.first_name} ${driver.last_name}`,
          location: coordinates
        }
      }
    });
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
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};