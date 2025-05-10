const Admin = require('../models/Admin');
const { invalidateCache } = require('../config/redis');
const { publishDriverStatusChange, publishCustomerEvent, publishStatsRequest
} = require('../services/messageService');

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

// Create new admin
exports.createAdmin = async (req, res) => {
  try {
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

    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(req.body.admin_id)) {
      return res.status(400).json({
        message: 'Invalid admin_id format. Must be XXX-XX-XXXX'
      });
    }

    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(req.body.zip_code)) {
      return res.status(400).json({
        message: 'Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX'
      });
    }

    const admin = new Admin(req.body);
    await admin.save();
    await invalidateCache('admins:all');

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

    await invalidateCache(`admins:${admin_id}`);
    await invalidateCache('admins:all');

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

    await publishDriverStatusChange(driver_id, `account_${status}`, {
      reviewed_by: req.user.admin_id,
      notes
    });

    res.status(200).json({
      message: 'Driver account review published successfully',
      data: {
        driver_id,
        status,
        notes
      }
    });
  } catch (error) {
    console.error('Error publishing driver review:', error);
    res.status(500).json({
      message: 'Failed to publish driver review',
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

    await publishCustomerEvent(customer_id, 'CUSTOMER_ACCOUNT_STATUS_CHANGE', {
      reviewed_by: req.user.admin_id,
      status,
      notes
    });

    res.status(200).json({
      message: 'Customer account review published successfully',
      data: {
        customer_id,
        status,
        notes
      }
    });
  } catch (error) {
    console.error('Error publishing customer review:', error);
    res.status(500).json({
      message: 'Failed to publish customer review',
      error: error.message
    });
  }
};

// Get system stats
exports.getSystemStats = async (req, res) => {
  try {
    const stats = await publishStatsRequest();
    res.status(200).json({
      message: 'System statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error retrieving system stats:', error);
    res.status(500).json({
      message: 'Failed to retrieve system statistics',
      error: error.message
    });
  }
};