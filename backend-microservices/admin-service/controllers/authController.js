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