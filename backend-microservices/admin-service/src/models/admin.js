const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { CustomError } = require('../../../shared/utils/errors');

const validStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const adminSchema = new mongoose.Schema({
  admin_id: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format (expected: XXX-XX-XXXX)']
  },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: {
    type: String,
    uppercase: true,
    enum: validStates,
    required: true
  },
  zip_code: {
    type: String,
    match: [/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'],
    required: true
  },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, {
  timestamps: true
});

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(new CustomError('Failed to hash password', 500));
  }
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = { Admin: mongoose.model('Admin', adminSchema) };