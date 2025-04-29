const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
  ride_id: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format for ride_id']
  },
  pickup_location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  dropoff_location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  date_time: {
    type: Date,
    required: true
  },
  customer_id: {
    type: String,
    required: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format for customer_id']
  },
  driver_id: {
    type: String,
    required: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format for driver_id']
  },
  fare_amount: {
    type: Number,
    required: true
  },
  passenger_count: {
    type: Number,
    required: false,
    default: 1
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  distance: {
    type: Number,
    required: false
  },
  duration: {
    type: Number, // in minutes
    required: false
  },
  rating: {
    customer_to_driver: { type: Number, min: 1, max: 5 },
    driver_to_customer: { type: Number, min: 1, max: 5 }
  }
}, {
  timestamps: true
});

// Add indexes for common queries
RideSchema.index({ customer_id: 1 });
RideSchema.index({ driver_id: 1 });
RideSchema.index({ status: 1 });
RideSchema.index({ date_time: -1 });

module.exports = mongoose.model('Ride', RideSchema);