const jwt = require('../utils/jwt'); 
const Customer = require('../models/Customer');

// Customer login
exports.customerLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    } try {
        const customer = await Customer.findOne({ email });

        if (!customer) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await customer.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.generateToken(customer.customer_id);

        res.status(200).json({
            message: 'Customer login successful',
            token,
            data: {
                customer_id: customer.customer_id,
                name: `${customer.first_name} ${customer.last_name}`,
                email: customer.email,
                role: 'customer',
            },
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

// Get current customer
exports.getCurrentUser = async (req, res) => {
  try {
    const customer = await Customer.findById({customer_id: req.user.customer_id}).select('-password -credit_card.cvv');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Don't return sensitive data
    const responseCustomer = customer.toObject();

    res.status(200).json({
      message: 'Customer retrieved successfully',
      data: {
        responseCustomer,
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Error retrieving customer:', error);
    res.status(500).json({ message: 'Server error' });
  }
};