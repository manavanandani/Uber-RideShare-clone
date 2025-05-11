const { AdminService } = require('../services/adminService');
const { redis } = require('../config/redis');
const { adminEventProducer } = require('../kafka/producers/adminEventProducer');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await AdminService.getAllAdmins();
    res.status(200).json({
      message: 'Admins retrieved successfully',
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    console.error('Error retrieving admins:', error);
    res.status(500).json({ message: 'Failed to retrieve admins' });
  }
};

exports.getAdminById = async (req, res) => {
  const { admin_id } = req.params;
  try {
    const admin = await AdminService.getAdminById(admin_id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(200).json({
      message: 'Admin retrieved successfully',
      data: admin,
    });
  } catch (error) {
    console.error('Error retrieving admin:', error);
    res.status(500).json({ message: 'Failed to retrieve admin' });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const admin = await AdminService.createAdmin(req.body);
    await redis.del('admins:all');
    res.status(201).json({
      message: 'Admin created successfully',
      data: admin,
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({
      message: 'Failed to create admin',
      error: error.message,
    });
  }
};

exports.updateAdmin = async (req, res) => {
  const { admin_id } = req.params;
  try {
    const admin = await AdminService.updateAdmin(admin_id, req.body);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    await redis.del(`admins:${admin_id}`);
    await redis.del('admins:all');
    res.status(200).json({
      message: 'Admin updated successfully',
      data: admin,
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({
      message: 'Failed to update admin',
      error: error.message,
    });
  }
};

exports.deleteAdmin = async (req, res) => {
  const { admin_id } = req.params;
  try {
    const admin = await AdminService.deleteAdmin(admin_id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    await redis.del(`admins:${admin_id}`);
    await redis.del('admins:all');
    res.status(200).json({
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      message: 'Failed to delete admin',
      error: error.message,
    });
  }
};

exports.reviewDriverAccount = async (req, res) => {
  const { driver_id } = req.params;
  const { status, notes } = req.body;
  try {
    if (!['approved', 'rejected', 'pending_review'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be "approved", "rejected", or "pending_review"',
      });
    }
    await adminEventProducer({
      topic: KAFKA_TOPICS.DRIVER_REVIEW_REQUEST,
      message: {
        driver_id,
        status,
        notes: notes || '',
        reviewed_by: req.user.admin_id,
        review_date: new Date().toISOString(),
      },
    });
    res.status(200).json({
      message: 'Driver account review request sent successfully',
      data: { driver_id, status, notes: notes || '' },
    });
  } catch (error) {
    console.error('Error reviewing driver account:', error);
    res.status(500).json({
      message: 'Failed to review driver account',
      error: error.message,
    });
  }
};

exports.reviewCustomerAccount = async (req, res) => {
  const { customer_id } = req.params;
  const { status, notes } = req.body;
  try {
    if (!['approved', 'suspended', 'active'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be "approved", "suspended", or "active"',
      });
    }
    await adminEventProducer({
      topic: KAFKA_TOPICS.CUSTOMER_REVIEW_REQUEST,
      message: {
        customer_id,
        status,
        notes: notes || '',
        reviewed_by: req.user.admin_id,
        review_date: new Date().toISOString(),
      },
    });
    res.status(200).json({
      message: 'Customer account review request sent successfully',
      data: { customer_id, status, notes: notes || '' },
    });
  } catch (error) {
    console.error('Error reviewing customer account:', error);
    res.status(500).json({
      message: 'Failed to review customer account',
      error: error.message,
    });
  }
};

exports.getSystemStats = async (req, res) => {
  try {
    const requestId = Date.now().toString();
    await adminEventProducer({
      topic: KAFKA_TOPICS.SYSTEM_STATS_REQUEST,
      message: { requestId },
    });
    const stats = await new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        const cachedStats = await redis.get(`stats:${requestId}`);
        if (cachedStats) {
          clearInterval(interval);
          resolve(JSON.parse(cachedStats));
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Timeout waiting for system stats'));
      }, 5000);
    });
    res.status(200).json({
      message: 'System statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Error retrieving system statistics:', error);
    res.status(500).json({
      message: 'Failed to retrieve system statistics',
      error: error.message,
    });
  }
};