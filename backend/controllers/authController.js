const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Driver = require('../models/Driver');
const Customer = require('../models/Customer');
const { mongoLocationToLatLng, latLngToMongoLocation } = require('../utils/locationUtils');


// Generate JWT
const generateToken = (id, role) => {
  const payload = {
    role
  };
  
  // Add role-specific ID
  payload[`${role}_id`] = id;
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Admin login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Find admin by email
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await admin.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    
    // Generate token
    const token = generateToken(admin.admin_id, 'admin');
    
    res.status(200).json({
      message: 'Admin login successful',
      token,
      data: {
        admin_id: admin.admin_id,
        name: `${admin.first_name} ${admin.last_name}`,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Driver login
exports.driverLogin = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Find driver by email
    const driver = await Driver.findOne({ email });
    
    if (!driver) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if driver is approved
    if (driver.account_status && driver.account_status !== 'approved') {
      return res.status(403).json({ 
        message: `Account not approved. Current status: ${driver.account_status}` 
      });
    }

    // Check if driver account is deleted
    if (driver.is_deleted) {
      return res.status(401).json({ message: 'This account has been deleted' });
    }
    
    // Check password
    const isMatch = await driver.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(driver.driver_id, 'driver');
    
    res.status(200).json({
      message: 'Driver login successful',
      token,
      data: {
        driver_id: driver.driver_id,
        name: `${driver.first_name} ${driver.last_name}`,
        email: driver.email,
        role: 'driver',
        status: driver.status
      }
    });
  } catch (error) {
    console.error('Driver login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Customer login
exports.customerLogin = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    // Find customer by email
    const customer = await Customer.findOne({ email });
    
    if (!customer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if customer account is deleted
    if (customer.is_deleted) {
      return res.status(401).json({ message: 'This account has been deleted' });
    }

    // Check if customer account is suspended
    if (customer.account_status === 'suspended') {
      return res.status(403).json({ message: 'Account is suspended' });
    }
    
    // Check password
    const isMatch = await customer.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(customer.customer_id, 'customer');

    const sanitizedCustomer = {
      customer_id: customer.customer_id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip_code: customer.zip_code,
      rating: customer.rating,
      role: "customer"
    };

    res.status(200).json({
      message: 'Customer login successful',
      token, data: sanitizedCustomer
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Register new customer
exports.registerCustomer = async (req, res) => {
  try {
    // First, check specifically if a customer with this SSN already exists
    const existingCustomerById = await Customer.findOne({ customer_id: req.body.customer_id });
    if (existingCustomerById) {
      return res.status(400).json({
        message: 'A customer with this SSN already exists. Please use a different SSN or contact support.'
      });
    }
    
    // Then check if customer already exists with this email or phone
    const existingCustomer = await Customer.findOne({
      $or: [
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });
    
    if (existingCustomer) {
      // Provide more specific message about which field is duplicated
      if (existingCustomer.email === req.body.email) {
        return res.status(400).json({
          message: 'A user with this email address already exists. Please use a different email or reset your password.'
        });
      } else {
        return res.status(400).json({
          message: 'A user with this phone number already exists. Please use a different phone number.'
        });
      }
    }
    
    // Validate SSN format for customer_id
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(req.body.customer_id)) {
      return res.status(400).json({
        message: 'Invalid SSN format. Must be XXX-XX-XXXX'
      });
    }
    
    // Validate ZIP code
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(req.body.zip_code)) {
      return res.status(400).json({
        message: 'Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX'
      });
    }
    
    // Validate credit card details
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
    
    // Create customer
    const customer = new Customer({
      ...req.body,
      account_status: 'active'
    });
    
    await customer.save();
    
    // Generate token
    const token = generateToken(customer.customer_id, 'customer');
    
    // Don't return sensitive data
    const responseCustomer = customer.toObject();
    delete responseCustomer.password;
    delete responseCustomer.credit_card.cvv;
    
    res.status(201).json({
      message: 'Customer registered successfully',
      token,
      data: {
        customer_id: customer.customer_id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Customer registration error:', error);
    
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'Registration failed. ';
      
      if (field === 'customer_id') {
        message += 'This SSN is already registered in our system.';
      } else if (field === 'email') {
        message += 'This email address is already registered.';
      } else if (field === 'phone') {
        message += 'This phone number is already registered.';
      } else {
        message += `The ${field} you provided is already in use.`;
      }
      
      return res.status(400).json({ message });
    }
    
    res.status(500).json({
      message: 'Registration failed. Please try again later.',
      error: error.message
    });
  }
};

// Register new driver
exports.registerDriver = async (req, res) => {
  try {
    // First, check specifically if a driver with this SSN already exists
    const existingDriverById = await Driver.findOne({ driver_id: req.body.driver_id });
    if (existingDriverById) {
      return res.status(400).json({
        message: 'A driver with this SSN already exists. Please use a different SSN or contact support.'
      });
    }
    
    // Then check if driver already exists with this email or phone
    const existingDriver = await Driver.findOne({
      $or: [
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });
    
    if (existingDriver) {
      // Provide more specific message about which field is duplicated
      if (existingDriver.email === req.body.email) {
        return res.status(400).json({
          message: 'A user with this email address already exists. Please use a different email or reset your password.'
        });
      } else {
        return res.status(400).json({
          message: 'A user with this phone number already exists. Please use a different phone number.'
        });
      }
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
    
    // Create driver with pending status
    const driver = new Driver({
      ...req.body,
      account_status: 'approved',
      status: 'offline'
    });
    
    await driver.save();
    
    res.status(201).json({
      message: 'Driver registration successful. You can login now.',
      data: {
        driver_id: driver.driver_id,
        name: `${driver.first_name} ${driver.last_name}`,
        email: driver.email,
        status: 'approved',
      }
    });
  } catch (error) {
    console.error('Driver registration error:', error);
    
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      let message = 'Registration failed. ';
      
      if (field === 'driver_id') {
        message += 'This SSN is already registered in our system.';
      } else if (field === 'email') {
        message += 'This email address is already registered.';
      } else if (field === 'phone') {
        message += 'This phone number is already registered.';
      } else {
        message += `The ${field} you provided is already in use.`;
      }
      
      return res.status(400).json({ message });
    }
    
    res.status(500).json({
      message: 'Registration failed. Please try again later.',
      error: error.message
    });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const { role } = req.user;
    let user;
    
    // Find user by role and ID
    switch (role) {
      case 'admin':
        user = await Admin.findOne({ admin_id: req.user.admin_id }).select('-password');
        break;
      case 'driver':
        user = await Driver.findOne({ driver_id: req.user.driver_id }).select('-password');
        break;
      case 'customer':
        user = await Customer.findOne({ customer_id: req.user.customer_id }).select('-password -credit_card.cvv');
        break;
      default:
        return res.status(400).json({ message: 'Invalid user role' });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      message: 'User profile retrieved successfully',
      data: {
        ...user.toObject(),
        role
      }
    });
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;