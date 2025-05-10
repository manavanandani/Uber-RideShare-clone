const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const validStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'AS', 'GU', 'MP', 'PR', 'VI'
];

const CustomerSchema = new mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format']
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
    maxlength: 10,
    match: [/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'],
    required: true
  },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 4 },
  credit_card: {
    number: {type: String, required: true, minlength: 16, maxlength: 16, match: [/^\d{16}$/, 'Credit card must be exactly 16 digits']},
    expiry: {type: String, required: true, match: [/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiry date format (MM/YY)']},
    name_on_card: { type: String, required: true },
    cvv: {type: String, required: true, minlength: 3, maxlength: 3, match: [/^\d{3}$/, 'CVV must be exactly 3 digits']}
  },
  rating: { type: Number, default: 0, required: true },
  is_deleted: { type: Boolean, default: false },
  deletion_date: { type: Date, default: null },
  reviews: [{
    driver_id: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    date: { type: Date, default: Date.now }
  }],
  ride_history: { type: [String], default: [] },
  last_location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  created_at: { type: Date, default: Date.now }
});

// Hash password before save
CustomerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

CustomerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add index for geospatial queries
CustomerSchema.index({ 'last_location': '2dsphere' });
CustomerSchema.index({ is_deleted: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);