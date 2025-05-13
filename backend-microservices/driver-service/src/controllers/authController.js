const jwt = require('jsonwebtoken');
const { Driver } = require('../models/driver');
const { sendMessage } = require('../kafka/driverEventProducer');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const driverService = require('../services/driverService');

// Generate JWT token
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  } catch (error) {
    throw new CustomError('Failed to generate token', 500);
  }
};

// Driver login
exports.driverLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new CustomError('Email and password are required', 400);
    }
    const driver = await Driver.findOne({ email });
    if (!driver) {
      throw new CustomError('Invalid credentials', 401);
    }
    const isMatch = await driver.matchPassword(password);
    if (!isMatch) {
      throw new CustomError('Invalid credentials', 401);
    }
    const token = generateToken({
      driver_id: driver.driver_id,
      role: 'driver'
    });
    res.status(200).json({
      message: 'Driver login successful',
      token,
      data: {
        driver_id: driver.driver_id,
        name: `${driver.first_name} ${driver.last_name}`,
        email: driver.email,
        role: 'driver'
      }
    });
  } catch (error) {
    console.error('Driver login error:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Register new driver
exports.registerDriver = async (req, res) => {
  try {
    await driverService.validateDriverData(req.body);
    const driver = new Driver({
      ...req.body,
      status: 'offline'
    });
    await driver.save();
    const token = generateToken({
      driver_id: driver.driver_id,
      role: 'driver'
    });
    await sendMessage({
      topic: KAFKA_TOPICS.DRIVER_EVENTS,
      message: {
        driver_id: driver.driver_id,
        event_type: 'DRIVER_CREATED',
        data: { name: `${driver.first_name} ${driver.last_name}` }
      }
    });
    const responseDriver = driver.toObject();
    delete responseDriver.password;
    res.status(201).json({
      message: 'Driver registered successfully',
      token,
      data: {
        driver_id: driver.driver_id,
        name: `${driver.first_name} ${driver.last_name}`,
        email: driver.email,
        role: 'driver'
      }
    });
  } catch (error) {
    console.error('Driver registration error:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Get current driver
exports.getCurrentUser = async (req, res) => {
  try {
    const driver = await Driver.findOne({ driver_id: req.user.driver_id })
      .select('-password');
    if (!driver) {
      throw new CustomError('Driver not found', 404);
    }
    res.status(200).json({
      message: 'Driver retrieved successfully',
      data: {
        driver_id: driver.driver_id,
        name: `${driver.first_name} ${driver.last_name}`,
        email: driver.email,
        role: 'driver'
      }
    });
  } catch (error) {
    console.error('Error retrieving driver:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};