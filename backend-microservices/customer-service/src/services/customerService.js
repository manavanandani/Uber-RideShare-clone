const { Customer } = require('../models/customer');
const { CustomError } = require('../../../shared/utils/errors');

const validateCustomerData = async (data) => {
  // Check for existing customer
  const existingCustomer = await Customer.findOne({
    $or: [
      { customer_id: data.customer_id },
      { email: data.email },
      { phone: data.phone }
    ]
  });
  if (existingCustomer) {
    if (existingCustomer.customer_id === data.customer_id) {
      throw new CustomError('A customer with this SSN already exists', 400);
    } else if (existingCustomer.email === data.email) {
      throw new CustomError('A user with this email address already exists', 400);
    } else {
      throw new CustomError('A user with this phone number already exists', 400);
    }
  }

  // Validate SSN format
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  if (!ssnRegex.test(data.customer_id)) {
    throw new CustomError('Invalid SSN format. Must be XXX-XX-XXXX', 400);
  }

  // Validate ZIP code
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(data.zip_code)) {
    throw new CustomError('Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX', 400);
  }

  // Validate credit card
  if (data.credit_card) {
    const ccNumberRegex = /^\d{13,19}$/;
    const ccExpiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex = /^\d{3,4}$/;
    if (!ccNumberRegex.test(data.credit_card.number)) {
      throw new CustomError('Invalid credit card number', 400);
    }
    if (!ccExpiryRegex.test(data.credit_card.expiry)) {
      throw new CustomError('Invalid credit card expiry date. Use MM/YY format', 400);
    }
    if (!cvvRegex.test(data.credit_card.cvv)) {
      throw new CustomError('Invalid CVV', 400);
    }
  }
};

module.exports = { validateCustomerData };