// controllers/customerController.js
const Customer = require('../models/Customer');
const { publishCustomerEvent } = require('../services/messageService');
const { invalidateCache } = require('../config/redis');

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().select('-password -credit_card.cvv');
    
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
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json({
      message: 'Customer retrieved successfully',
      data: customer
    });
  } catch (error) {
    console.error('Error retrieving customer:', error);
    res.status(500).json({ message: 'Failed to retrieve customer' });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { customer_id: req.body.customer_id },
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });
    
    if (existingCustomer) {
      return res.status(400).json({
        message: 'Customer already exists with this ID, email, or phone number'
      });
    }
    
    // Validate SSN format for customer_id
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(req.body.customer_id)) {
      return res.status(400).json({
        message: 'Invalid customer_id format. Must be XXX-XX-XXXX'
      });
    }
    
    // Validate ZIP code
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(req.body.zip_code)) {
      return res.status(400).json({
        message: 'Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX'
      });
    }
    
    // Validate credit card
    if (req.body.credit_card) {
      const ccNumberRegex = /^\d{13,19}$/;
      const ccExpiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
      const cvvRegex = /^\d{3,4}$/;
      
      if (!ccNumberRegex.test(req.body.credit_card.number)) {
        return res.status(400).json({
          message: 'Invalid credit card number'
        });
      }
      
      if (!ccExpiryRegex.test(req.body.credit_card.expiry)) {
        return res.status(400).json({
          message: 'Invalid credit card expiry date. Use MM/YY format'
        });
      }
      
      if (!cvvRegex.test(req.body.credit_card.cvv)) {
        return res.status(400).json({
          message: 'Invalid CVV'
        });
      }
    }
    
    const customer = new Customer(req.body);
    await customer.save();
    
    // Invalidate any relevant caches
    await invalidateCache('customers:all');
    
    // Publish customer creation event
    await publishCustomerEvent(
      // controllers/customerController.js (continued)
      customer.customer_id,
      'CUSTOMER_CREATED',
      { name: `${customer.first_name} ${customer.last_name}` }
    );
    
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
    res.status(500).json({
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

// Update a customer
exports.updateCustomer = async (req, res) => {
  const { customer_id } = req.params;
  
  try {
    // If updating email or phone, check if they're already in use
    if (req.body.email || req.body.phone) {
      const existingCustomer = await Customer.findOne({
        $or: [
          { email: req.body.email, customer_id: { $ne: customer_id } },
          { phone: req.body.phone, customer_id: { $ne: customer_id } }
        ]
      });
      
      if (existingCustomer) {
        return res.status(400).json({
          message: 'Email or phone number already in use by another customer'
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
    
    // Validate credit card details if provided
    if (req.body.credit_card) {
      if (req.body.credit_card.number) {
        const ccNumberRegex = /^\d{13,19}$/;
        if (!ccNumberRegex.test(req.body.credit_card.number)) {
          return res.status(400).json({
            message: 'Invalid credit card number'
          });
        }
      }
      
      if (req.body.credit_card.expiry) {
        const ccExpiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!ccExpiryRegex.test(req.body.credit_card.expiry)) {
          return res.status(400).json({
            message: 'Invalid credit card expiry date. Use MM/YY format'
          });
        }
      }
      
      if (req.body.credit_card.cvv) {
        const cvvRegex = /^\d{3,4}$/;
        if (!cvvRegex.test(req.body.credit_card.cvv)) {
          return res.status(400).json({
            message: 'Invalid CVV'
          });
        }
      }
    }
    
    const customer = await Customer.findOneAndUpdate(
      { customer_id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Invalidate any relevant caches
    await invalidateCache(`customers:${customer_id}`);
    await invalidateCache('customers:all');
    
    // Publish customer update event
    await publishCustomerEvent(
      customer.customer_id,
      'CUSTOMER_UPDATED',
      { name: `${customer.first_name} ${customer.last_name}` }
    );
    
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
    res.status(500).json({
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  const { customer_id } = req.params;
  
  try {
    const customer = await Customer.findOneAndDelete({ customer_id });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Invalidate any relevant caches
    await invalidateCache(`customers:${customer_id}`);
    await invalidateCache('customers:all');
    
    // Publish customer deletion event
    await publishCustomerEvent(
      customer_id,
      'CUSTOMER_DELETED',
      { name: `${customer.first_name} ${customer.last_name}` }
    );
    
    res.status(200).json({
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

// Search customers
exports.searchCustomers = async (req, res) => {
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
    
    const customers = await Customer.find(query).select('-password -credit_card.cvv');
    
    res.status(200).json({
      message: 'Search results',
      count: customers.length,
      data: customers
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({
      message: 'Failed to search customers',
      error: error.message
    });
  }
};

// Update customer location
exports.updateCustomerLocation = async (req, res) => {
  const { customer_id } = req.params;
  const { latitude, longitude } = req.body;
  
  try {
    // Validate inputs
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    const customer = await Customer.findOneAndUpdate(
      { customer_id },
      { 
        $set: { 
          last_location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          }
        }
      },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Invalidate relevant caches
    await invalidateCache(`customers:${customer_id}`);
    
    // Publish customer location update event
    await publishCustomerEvent(
      customer_id,
      'CUSTOMER_LOCATION_UPDATED',
      { location: customer.last_location }
    );
    
    res.status(200).json({
      message: 'Customer location updated successfully',
      data: {
        customer_id,
        location: customer.last_location
      }
    });
  } catch (error) {
    console.error('Error updating customer location:', error);
    res.status(500).json({
      message: 'Failed to update customer location',
      error: error.message
    });
  }
};

// Get customer reviews
exports.getCustomerReviews = async (req, res) => {
  const { customer_id } = req.params;
  
  try {
    const customer = await Customer.findOne({ customer_id }).select('reviews');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.status(200).json({
      message: 'Customer reviews retrieved successfully',
      count: customer.reviews.length,
      data: customer.reviews
    });
  } catch (error) {
    console.error('Error retrieving customer reviews:', error);
    res.status(500).json({
      message: 'Failed to retrieve customer reviews',
      error: error.message
    });
  }
};

// Upload customer ride images
exports.uploadRideImages = async (req, res) => {
  const { customer_id, ride_id } = req.params;
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Create URLs for the uploaded files
    const imageUrls = req.files.map(file => `/api/media/${file.filename}`);
    
    // Add ride images to customer document
    const customer = await Customer.findOneAndUpdate(
      { customer_id },
      { 
        $push: { 
          'ride_images': {
            ride_id,
            images: imageUrls,
            uploaded_at: new Date()
          }
        }
      },
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Invalidate cache
    await invalidateCache(`customers:${customer_id}`);
    await invalidateCache(`rides:${ride_id}`);
    
    // Publish event
    await publishCustomerEvent(
      customer_id,
      'CUSTOMER_UPLOADED_IMAGES',
      { ride_id, image_count: imageUrls.length }
    );
    
    res.status(200).json({
      message: 'Ride images uploaded successfully',
      data: {
        ride_id,
        image_urls: imageUrls
      }
    });
  } catch (error) {
    console.error('Error uploading ride images:', error);
    res.status(500).json({
      message: 'Failed to upload ride images',
      error: error.message
    });
  }
};

module.exports = exports;