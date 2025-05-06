const mongoose = require('mongoose');

const BillingSchema = new mongoose.Schema({
  bill_id: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format for bill_id']
  },
  date: {
    type: Date,
    required: true
  },
  pickup_time: {
    type: Date,
    required: true
  },
  dropoff_time: {
    type: Date,
    required: true,

  },
  distance_covered: {
    type: Number,
    required: true,
    min: [0, 'Distance cannot be negative']
  },
  total_amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be non-negative']
  },
  source_location: {
    type: String,
    required: true
  },
  destination_location: {
    type: String,
    required: true
  },
  driver_id: {
    type: String,
    required: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format for driver_id']
  },
  customer_id: {
    type: String,
    required: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format for customer_id']
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  payment_method: {
    type: String,
    enum: ['credit_card', 'cash'],
    default: 'credit_card'
  },
  ride_id: {
    type: String,
    required: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Invalid SSN format for ride_id']
  },
  breakdown: {
    base_fare: { type: Number, required: true },
    distance_fare: { type: Number, required: true },
    time_fare: { type: Number, required: true },
    surge_multiplier: { type: Number, required: true, default: 1.0 }
  }
}, {
  timestamps: true
});

// Add indexes for common queries
BillingSchema.index({ customer_id: 1 });
BillingSchema.index({ driver_id: 1 });
BillingSchema.index({ date: -1 });
BillingSchema.index({ ride_id: 1 });

BillingSchema.index({ payment_status: 1, date: -1 });
BillingSchema.index({ customer_id: 1, payment_status: 1 });
BillingSchema.index({ driver_id: 1, date: -1 });

module.exports = mongoose.model('Billing', BillingSchema);