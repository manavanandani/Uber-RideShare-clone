const { Driver } = require('../model/driver');
const { CustomError } = require('../../../shared/utils/errors');

const validStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'AS', 'GU', 'MP', 'PR', 'VI'
];

const validateDriverData = async (data) => {
  const existingDriver = await Driver.findOne({
    $or: [
      { driver_id: data.driver_id },
      { email: data.email },
      { phone: data.phone }
    ]
  });
  if (existingDriver) {
    if (existingDriver.driver_id === data.driver_id) {
      throw new CustomError('A driver with this SSN already exists', 400);
    } else if (existingDriver.email === data.email) {
      throw new CustomError('A user with this email address already exists', 400);
    } else {
      throw new CustomError('A user with this phone number already exists', 400);
    }
  }

  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  if (!ssnRegex.test(data.driver_id)) {
    throw new CustomError('Invalid SSN format. Must be XXX-XX-XXXX', 400);
  }

  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(data.zip_code)) {
    throw new CustomError('Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX', 400);
  }

  if (!validStates.includes(data.state)) {
    throw new CustomError('Invalid state code', 400);
  }

  if (data.password && data.password.length < 4) {
    throw new CustomError('Password must be at least 4 characters long', 400);
  }

  if (!data.car_details || typeof data.car_details !== 'string') {
    throw new CustomError('Car details must be a non-empty string', 400);
  }
};

const validateDriverUpdate = async (data, driver_id) => {
  if (data.email || data.phone) {
    const existingDriver = await Driver.findOne({
      $or: [
        { email: data.email, driver_id: { $ne: driver_id } },
        { phone: data.phone, driver_id: { $ne: driver_id } }
      ]
    });
    if (existingDriver) {
      throw new CustomError('Email or phone number already in use by another driver', 400);
    }
  }
  if (data.zip_code) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(data.zip_code)) {
      throw new CustomError('Invalid ZIP code format. Must be XXXXX or XXXXX-XXXX', 400);
    }
  }
  if (data.state && !validStates.includes(data.state)) {
    throw new CustomError('Invalid state code', 400);
  }
  if (data.car_details && typeof data.car_details !== 'string') {
    throw new CustomError('Car details must be a string', 400);
  }
};

module.exports = { validateDriverData, validateDriverUpdate };