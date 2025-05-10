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

const DriverSchema = new mongoose.Schema({
  driver_id: {type: String, required: true, unique: true, match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format']},
  first_name: {type: String, required: true},
  last_name: {type: String, required: true},
  address: {type: String, required: true},
  city: {type: String, required: true},
  state: {type: String, uppercase: true, enum: validStates, required: true},
  zip_code: {type: String, match: [/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'], required: true},
  phone: {type: String, required: true},
  email: { type: String, unique: true, required: true },
  password: {type: String, required: true, minlength: 4},
  car_details: {type: String, required: true},
  rating: { type: Number, default: 0, required: true },
  reviews: [{
    ride_id: {type: String, required: true},
    customer_id: {type: String, required: true}, 
    rating: {type: Number, min:1, max:5},
    comment: {type: String},
    date: {type: Date, required: true, default: Date.now}}],
  intro_media: {
      image_urls: {type: [String], default: []},
      video_url: {type: String, default: ''},
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
  coordinates: {
    type: [Number], // [longitude, latitude]
    default: [0, 0]
  }
  }
},
  ride_history: {type: [String], default: []},
  status: {type: String, enum: ['available', 'busy', 'offline'], default: 'offline'},
  created_at: {type: Date, default: Date.now},
});

DriverSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

DriverSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add index for geospatial queries
DriverSchema.index({ 'intro_media.location': '2dsphere' });

DriverSchema.index({ status: 1, 'intro_media.location': '2dsphere' });


module.exports = mongoose.model('Driver', DriverSchema);