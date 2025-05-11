const jwt = require('jsonwebtoken');
const { Admin } = require('../models/admin');
const { redis } = require('../config/redis');
const { CustomError } = require('../../../shared/utils/errors');

exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError('Email and password are required', 400);
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      throw new CustomError('Invalid credentials', 401);
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      throw new CustomError('Invalid credentials', 401);
    }

    const token = jwt.sign(
      { admin_id: admin.admin_id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.status(200).json({
      message: 'Admin login successful',
      token,
      data: {
        admin_id: admin.admin_id,
        name: `${admin.first_name} ${admin.last_name}`,
        email: admin.email,
        address: admin.address,
        city: admin.city,
        state: admin.state,
        zip_code: admin.zip_code,
        phone: admin.phone,
        role: 'admin',
      },
    });
  } catch (error) {
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const cacheKey = `admin:${req.user.admin_id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const admin = await Admin.findOne({ admin_id: req.user.admin_id }).select('-password');
    if (!admin) {
      throw new CustomError('Admin not found', 404);
    }

    const response = {
      message: 'Admin profile retrieved successfully',
      data: {
        admin_id: admin.admin_id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        address: admin.address,
        city: admin.city,
        state: admin.state,
        zip_code: admin.zip_code,
        phone: admin.phone,
        role: 'admin',
      },
    };

    await redis.set(cacheKey, JSON.stringify(response), 'EX', 3600);
    res.status(200).json(response);
  } catch (error) {
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};