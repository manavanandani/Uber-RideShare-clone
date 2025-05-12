const jwt = require('jsonwebtoken');
const { Customer } = require('../models/customer');
const { sendMessage } = require('../kafka/customerEventProducer');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const customerService = require('../services/customerService');

// Generate JWT token
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  } catch (error) {
    throw new CustomError('Failed to generate token', 500);
  }
};

// Customer login
exports.customerLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new CustomError('Email and password are required', 400);
    }
    const customer = await Customer.findOne({ email });
    if (!customer) {
      throw new CustomError('Invalid credentials', 401);
    }
    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      throw new CustomError('Invalid credentials', 401);
    }
    const token = generateToken({
      customer_id: customer.customer_id,
      role: 'customer'
    });
    res.status(200).json({
      message: 'Customer login successful',
      token,
      data: {
        customer_id: customer.customer_id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Register new customer
exports.registerCustomer = async (req, res) => {
  try {
    await customerService.validateCustomerData(req.body);
    const customer = new Customer({
      ...req.body,
      account_status: 'active'
    });
    await customer.save();
    const token = generateToken({
      customer_id: customer.customer_id,
      role: 'customer'
    });
    await sendMessage({
      topic: KAFKA_TOPICS.CUSTOMER_EVENTS,
      message: {
        customer_id: customer.customer_id,
        event_type: 'CUSTOMER_CREATED',
        data: { name: `${customer.first_name} ${customer.last_name}` }
      }
    });
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
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};

// Get current customer
exports.getCurrentUser = async (req, res) => {
  try {
    const customer = await Customer.findOne({ customer_id: req.user.customer_id }).select('-password -credit_card.cvv');
    if (!customer) {
      throw new CustomError('Customer not found', 404);
    }
    res.status(200).json({
      message: 'Customer retrieved successfully',
      data: {
        customer_id: customer.customer_id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Error retrieving customer:', error);
    const status = error instanceof CustomError ? error.status : 500;
    res.status(status).json({ message: error.message });
  }
};