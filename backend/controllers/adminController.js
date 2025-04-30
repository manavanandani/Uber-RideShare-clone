// controllers/adminController.js
const Admin = require('../models/Admin');
const Driver = require('../models/Driver');
const Customer = require('../models/Customer');
const Ride = require('../models/Ride');
const Billing = require('../models/Billing');
const { invalidateCache } = require('../config/redis');
const { publishDriverStatusChange, publishCustomerEvent } = require('../services/messageService');
const { mongoLocationToLatLng, latLngToMongoLocation } = require('../utils/locationUtils');


// Get all admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    
    res.status(200).json({
      message: 'Admins retrieved successfully',
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Error retrieving admins:', error);
    res.status(500).json({ message: 'Failed to retrieve admins' });
  }
};

// Get single admin by ID
exports.getAdminById = async (req, res) => {
  const { admin_id } = req.params;
  
  try {
    const admin = await Admin.findOne({ admin_id }).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.status(200).json({
      message: 'Admin retrieved successfully',
      data: admin
    });
  } catch (error) {
    console.error('Error retrieving admin:', error);
    res.status(500).json({ message: 'Failed to retrieve admin' });
  }
};

// In backend/controllers/adminController.js - modify the createAdmin function
exports.createAdmin = async (req, res) => {
  try {
    // Check if admin with the same ID, email, or phone exists
    const existingAdmin = await Admin.findOne({
      $or: [
        { admin_id: req.body.admin_id },
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });
    
    if (existingAdmin) {
      return res.status(400).json({
        message: 'Admin already exists with this ID, email, or phone number'
      });
    }
    
    // Validate SSN format for admin_id
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(req.body.admin_id)) {
      return res.status(400).json({
        message: 'Invalid admin_id format. Must be XXX-XX-XXXX'
      });
    }
    
    // Validate ZIP code
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(req.body.zip_code)) {
      return res.status(400).json({
        message: 'Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX'
      });
    }
    
    const admin = new Admin(req.body);
    await admin.save();
    
    // Invalidate any relevant caches
    await invalidateCache('admins:all');
    
    // Return without sensitive data
    const responseAdmin = admin.toObject();
    delete responseAdmin.password;
    
    res.status(201).json({
      message: 'Admin created successfully',
      data: responseAdmin
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      message: 'Failed to create admin',
      error: error.message
    });
  }
};

// Update an admin
exports.updateAdmin = async (req, res) => {
  const { admin_id } = req.params;
  
  try {
    // If updating email or phone, check if they're already in use
    if (req.body.email || req.body.phone) {
      const existingAdmin = await Admin.findOne({
        $or: [
          { email: req.body.email, admin_id: { $ne: admin_id } },
          { phone: req.body.phone, admin_id: { $ne: admin_id } }
        ]
      });
      
      if (existingAdmin) {
        return res.status(400).json({
          message: 'Email or phone number already in use by another admin'
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
    
    const admin = await Admin.findOneAndUpdate(
      { admin_id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Invalidate any relevant caches
    await invalidateCache(`admins:${admin_id}`);
    await invalidateCache('admins:all');
    
    // Return without sensitive data
    const responseAdmin = admin.toObject();
    delete responseAdmin.password;
    
    res.status(200).json({
      message: 'Admin updated successfully',
      data: responseAdmin
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      message: 'Failed to update admin',
      error: error.message
    });
  }
};

// Delete an admin
exports.deleteAdmin = async (req, res) => {
  const { admin_id } = req.params;
  
  try {
    const admin = await Admin.findOneAndDelete({ admin_id });
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Invalidate any relevant caches
    await invalidateCache(`admins:${admin_id}`);
    await invalidateCache('admins:all');
    
    res.status(200).json({
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      message: 'Failed to delete admin',
      error: error.message
    });
  }
};

// Review driver account
exports.reviewDriverAccount = async (req, res) => {
  const { driver_id } = req.params;
  const { status, notes } = req.body;
  
  try {
    if (!status || !['approved', 'rejected', 'pending_review'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be "approved", "rejected", or "pending_review"' 
      });
    }
    
    const driver = await Driver.findOne({ driver_id });
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Update driver review status
    const updatedDriver = await Driver.findOneAndUpdate(
      { driver_id },
      { 
        $set: { 
          account_status: status,
          admin_review: {
            reviewed_by: req.user.admin_id,
            review_date: new Date(),
            status: status,
            notes: notes || ''
          }
        }
      },
      { new: true }
    );
    
    // Invalidate caches
    await invalidateCache(`drivers:${driver_id}`);
    
    // Publish driver status change event
    await publishDriverStatusChange(
      driver_id,
      `account_${status}`,
      null
    );
    
    res.status(200).json({
      message: 'Driver account reviewed successfully',
      data: {
        driver_id,
        status: updatedDriver.account_status,
        review: updatedDriver.admin_review
      }
    });
  } catch (error) {
    console.error('Error reviewing driver account:', error);
    res.status(500).json({
      message: 'Failed to review driver account',
      error: error.message
    });
  }
};

// Review customer account
exports.reviewCustomerAccount = async (req, res) => {
  const { customer_id } = req.params;
  const { status, notes } = req.body;
  
  try {
    if (!status || !['approved', 'suspended', 'active'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be "approved", "suspended", or "active"' 
      });
    }
    
    const customer = await Customer.findOne({ customer_id });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Update customer status
    const updatedCustomer = await Customer.findOneAndUpdate(
      { customer_id },
      { 
        $set: { 
          account_status: status,
          admin_review: {
            reviewed_by: req.user.admin_id,
            review_date: new Date(),
            status: status,
            notes: notes || ''
          }
        }
      },
      { new: true }
    );
    
    // Invalidate caches
    await invalidateCache(`customers:${customer_id}`);
    
    // Publish customer status change event
    await publishCustomerEvent(
      customer_id,
      'CUSTOMER_ACCOUNT_STATUS_CHANGE',
      { status }
    );
    
    res.status(200).json({
      message: 'Customer account reviewed successfully',
      data: {
        customer_id,
        status: updatedCustomer.account_status,
        review: updatedCustomer.admin_review
      }
    });
  } catch (error) {
    console.error('Error reviewing customer account:', error);
    res.status(500).json({
      message: 'Failed to review customer account',
      error: error.message
    });
  }
};

// Get system statistics summary
exports.getSystemStats = async (req, res) => {
  try {
    // Get counts from different collections
    const [driverCount, customerCount, rideCount, billingCount] = await Promise.all([
      Driver.countDocuments(),
      Customer.countDocuments(),
      Ride.countDocuments(),
      Billing.countDocuments()
    ]);
    
    // Get some revenue stats
    const revenueStats = await Billing.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total_amount" },
          avgRideCost: { $avg: "$total_amount" },
          minRideCost: { $min: "$total_amount" },
          maxRideCost: { $max: "$total_amount" }
        }
      }
    ]);
    
    // Get ride status counts
    const rideStatusCounts = await Ride.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format ride status counts into an object
    const rideStatusDistribution = {};
    rideStatusCounts.forEach(status => {
      rideStatusDistribution[status._id] = status.count;
    });
    
    res.status(200).json({
      message: 'System statistics retrieved successfully',
      data: {
        counts: {
          drivers: driverCount,
          customers: customerCount,
          rides: rideCount,
          billings: billingCount
        },
        revenue: revenueStats.length > 0 ? {
          total: revenueStats[0].totalRevenue,
          average: revenueStats[0].avgRideCost,
          minimum: revenueStats[0].minRideCost,
          maximum: revenueStats[0].maxRideCost
        } : {
          total: 0,
          average: 0,
          minimum: 0,
          maximum: 0
        },
        rideStatusDistribution
      }
    });
  } catch (error) {
    console.error('Error retrieving system statistics:', error);
    res.status(500).json({
      message: 'Failed to retrieve system statistics',
      error: error.message
    });
  }
};

module.exports = exports;