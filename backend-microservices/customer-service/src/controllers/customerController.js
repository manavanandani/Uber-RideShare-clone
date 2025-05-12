const { Customer } = require('../models/customer');
const { sendMessage } = require('../kafka/producers/customerEventProducer');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { invalidateCache } = require('../config/redis');
const { mongoLocationToLatLng, latLngToMongoLocation } = require('../utils/locationUtils');
const { CustomError } = require('../../../shared/utils/errors');

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ is_deleted: { $ne: true } }).select('-password -credit_card.cvv');
    res.status(200).json({
      message: 'Customers retrieved successfully',
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Error retrieving customers:', error);
    res.status(500).json({ message: 'Failed to retrieve customers' });
  }
};

// Get single customer by ID
exports.getCustomerById = async (req, res) => {
  const { customer_id } = req.params;
  try {
    const customer = await Customer.findOne({ customer_id }).select('-password -credit_card.cvv');
    if (!customer) {
      throw new CustomError('Customer not found', 404);
    }
    res.status(200).json({
      message: 'Customer retrieved successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error retrieving customer:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    // Check for existing customer
    const existingCustomer = await Customer.findOne({
      $or: [
        { customer_id: req.body.customer_id },
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });
    if (existingCustomer) {
      throw new CustomError('Customer already exists with this ID, email, or phone number', 400);
    }

    // Validate SSN format
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(req.body.customer_id)) {
      throw new CustomError('Invalid customer_id format. Must be XXX-XX-XXXX', 400);
    }

    // Validate ZIP code
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(req.body.zip_code)) {
      throw new CustomError('Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX', 400);
    }

    // Validate credit card
    if (req.body.credit_card) {
      const ccNumberRegex = /^\d{13,19}$/;
      const ccExpiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      const cvvRegex = /^\d{3,4}$/;
      if (!ccNumberRegex.test(req.body.credit_card.number)) {
        throw new CustomError('Invalid credit card number', 400);
      }
      if (!ccExpiryRegex.test(req.body.credit_card.expiry)) {
        throw new CustomError('Invalid credit card expiry date. Use MM/YY format', 400);
      }
      if (!cvvRegex.test(req.body.credit_card.cvv)) {
        throw new CustomError('Invalid CVV', 400);
      }
    }

    const customer = new Customer(req.body);
    await customer.save();

    // Invalidate cache
    await invalidateCache('customers:all');

    // Publish event
    await sendMessage({
      topic: KAFKA_TOPICS.CUSTOMER_EVENTS,
      message: {
        customer_id: customer.customer_id,
        event_type: 'CUSTOMER_CREATED',
        data: { name: `${customer.first_name} ${customer.last_name}` }
      }
    });

    // Return without sensitive data
    const responseCustomer = customer.toObject();
    delete responseCustomer.password;
    delete responseCustomer.credit_card.cvv;

    res.status(201).json({
      message: 'Customer created successfully',
      data: responseCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  const { customer_id } = req.params;
  try {
    // Check for email/phone conflicts
    if (req.body.email || req.body.phone) {
      const existingCustomer = await Customer.findOne({
        $or: [
          { email: req.body.email, customer_id: { $ne: customer_id } },
          { phone: req.body.phone, customer_id: { $ne: customer_id } }
        ]
      });
      if (existingCustomer) {
        throw new CustomError('Email or phone number already in use by another customer', 400);
      }
    }

    // Validate ZIP code
    if (req.body.zip_code) {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(req.body.zip_code)) {
        throw new CustomError('Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX', 400);
      }
    }

    // Handle credit card updates
    const currentCustomer = await Customer.findOne({ customer_id });
    if (!currentCustomer) {
      throw new CustomError('Customer not found', 404);
    }

    const updateData = { ...req.body };
    if (updateData.credit_card) {
      if (!currentCustomer.credit_card) {
        currentCustomer.credit_card = {};
      }
      if (updateData.credit_card.number) {
        const ccNumberRegex = /^\d{13,19}$/;
        if (!ccNumberRegex.test(updateData.credit_card.number)) {
          throw new CustomError('Invalid credit card number', 400);
        }
      } else {
        updateData.credit_card.number = currentCustomer.credit_card.number;
      }
      if (updateData.credit_card.expiry) {
        const ccExpiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!ccExpiryRegex.test(updateData.credit_card.expiry)) {
          throw new CustomError('Invalid credit card expiry date. Use MM/YY format', 400);
        }
      } else {
        updateData.credit_card.expiry = currentCustomer.credit_card.expiry;
      }
      if (updateData.credit_card.cvv) {
        const cvvRegex = /^\d{3,4}$/;
        if (!cvvRegex.test(updateData.credit_card.cvv)) {
          throw new CustomError('Invalid CVV', 400);
        }
      } else {
        updateData.credit_card.cvv = currentCustomer.credit_card.cvv;
      }
      if (!updateData.credit_card.name_on_card) {
        updateData.credit_card.name_on_card = currentCustomer.credit_card.name_on_card;
      }
    }

    const customer = await Customer.findOneAndUpdate(
      { customer_id },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!customer) {
      throw new CustomError('Customer not found', 404);
    }

    // Invalidate cache
    await invalidateCache(`customers:${customer_id}`);
    await invalidateCache('customers:all');

    // Publish event
    await sendMessage({
      topic: KAFKA_TOPICS.CUSTOMER_EVENTS,
      message: {
        customer_id,
        event_type: 'CUSTOMER_UPDATED',
        data: { name: `${customer.first_name} ${customer.last_name}` }
      }
    });

    // Return without sensitive data
    const responseCustomer = customer.toObject();
    delete responseCustomer.password;
    delete responseCustomer.credit_card.cvv;

    res.status(200).json({
      message: 'Customer updated successfully',
      data: responseCustomer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Delete a customer (soft delete)
exports.deleteCustomerProfile = async (req, res) => {
  const { customer_id } = req.params;
  try {
    // Verify authorization
    if (req.user.role !== 'admin' && req.user.customer_id !== customer_id) {
      throw new CustomError('Unauthorized to delete this profile', 403);
    }

    const customer = await Customer.findOne({ customer_id });
    if (!customer) {
      throw new CustomError('Customer not found', 404);
    }
    if (customer.is_deleted) {
      throw new CustomError('Profile already deleted', 400);
    }

    const result = await Customer.findOneAndUpdate(
      { customer_id },
      {
        $set: {
          is_deleted: true,
          deletion_date: new Date(),
          email: `deleted-${customer_id}@example.com`,
          phone: '000-000-0000'
        },
        $unset: { password: '' }
      },
      { new: true }
    );

    // Invalidate cache
    await invalidateCache(`*customer*${customer_id}*`);

    // Publish event
    await sendMessage({
      topic: KAFKA_TOPICS.CUSTOMER_EVENTS,
      message: {
        customer_id,
        event_type: 'CUSTOMER_DELETED',
        data: { name: `${customer.first_name} ${customer.last_name}` }
      }
    });

    res.status(200).json({
      message: 'Profile deleted successfully',
      data: { customer_id }
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Search customers
exports.searchCustomers = async (req, res) => {
  try {
    const query = { is_deleted: { $ne: true } };
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

    const customers = await Customer.find(query).select('-password -credit_card.cvv');
    res.status(200).json({
      message: 'Search results',
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ message: 'Failed to search customers' });
  }
};

// Update customer location
exports.updateCustomerLocation = async (req, res) => {
  const { customer_id } = req.params;
  const { latitude, longitude } = req.body;
  try {
    if (!latitude || !longitude) {
      throw new CustomError('Latitude and longitude are required', 400);
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new CustomError('Invalid coordinates', 400);
    }
    if (req.user.role !== 'admin' && req.user.customer_id !== customer_id) {
      throw new CustomError('Unauthorized to update this customer location', 403);
    }

    const customer = await Customer.findOneAndUpdate(
      { customer_id },
      {
        $set: {
          last_location: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        }
      },
      { new: true }
    );
    if (!customer) {
      throw new CustomError('Customer not found', 404);
    }

    await invalidateCache(`customers:${customer_id}`);
    res.status(200).json({
      message: 'Customer location updated successfully',
      data: { customer_id, location: { latitude: lat, longitude: lng } }
    });
  } catch (error) {
    console.error('Error updating customer location:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Get customer reviews
exports.getCustomerReviews = async (req, res) => {
  const { customer_id } = req.params;
  try {
    const customer = await Customer.findOne({ customer_id }).select('reviews');
    if (!customer) {
      throw new CustomError('Customer not found', 404);
    }
    res.status(200).json({
      message: 'Customer reviews retrieved successfully',
      count: customer.reviews.length,
      data: customer.reviews
    });
  } catch (error) {
    console.error('Error retrieving customer reviews:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Upload customer ride images
exports.uploadRideImages = async (req, res) => {
  const { customer_id, ride_id } = req.params;
  try {
    if (!req.files || req.files.length === 0) {
      throw new CustomError('No files uploaded', 400);
    }
    const imageUrls = req.files.map(file => `/api/media/${file.filename}`);
    const customer = await Customer.findOneAndUpdate(
      { customer_id },
      {
        $push: {
          ride_images: {
            ride_id,
            images: imageUrls,
            uploaded_at: new Date()
          }
        }
      },
      { new: true }
    );
    if (!customer) {
      throw new CustomError('Customer not found', 404);
    }

    await invalidateCache(`customers:${customer_id}`);
    await sendMessage({
      topic: KAFKA_TOPICS.CUSTOMER_EVENTS,
      message: {
        customer_id,
        event_type: 'CUSTOMER_UPLOADED_IMAGES',
        data: { ride_id, image_count: imageUrls.length }
      }
    });

    res.status(200).json({
      message: 'Ride images uploaded successfully',
      data: { ride_id, image_urls: imageUrls }
    });
  } catch (error) {
    console.error('Error uploading ride images:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Upload customer media
exports.uploadCustomerMedia = async (req, res) => {
  const { customer_id } = req.params;
  try {
    if (!req.file) {
      throw new CustomError('No file uploaded', 400);
    }
    const fileUrl = `/api/media/${req.file.filename}`;
    const customer = await Customer.findOne({ customer_id });
    if (!customer) {
      throw new CustomError('Customer not found', 404);
    }

    if (!customer.intro_media) {
      customer.intro_media = { image_urls: [] };
    }
    if (!customer.intro_media.image_urls) {
      customer.intro_media.image_urls = [];
    }
    customer.intro_media.image_urls.unshift(fileUrl);
    await customer.save();

    await invalidateCache(`*customer*${customer_id}*`);
    res.status(200).json({
      message: 'Media uploaded successfully',
      data: { customer_id, intro_media: customer.intro_media }
    });
  } catch (error) {
    console.error('Error uploading customer media:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};