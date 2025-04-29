const { sendMessage } = require('../config/kafka');

// Ride request handlers
const publishRideRequest = async (rideData) => {
  return await sendMessage('ride_requests', {
    type: 'RIDE_REQUESTED',
    timestamp: new Date().toISOString(),
    data: rideData
  });
};

const publishRideAccepted = async (rideId, driverId) => {
  return await sendMessage('ride_responses', {
    type: 'RIDE_ACCEPTED',
    timestamp: new Date().toISOString(),
    data: { rideId, driverId }
  });
};

const publishRideRejected = async (rideId, driverId, reason) => {
  return await sendMessage('ride_responses', {
    type: 'RIDE_REJECTED',
    timestamp: new Date().toISOString(),
    data: { rideId, driverId, reason }
  });
};

const publishRideCompleted = async (rideId) => {
  return await sendMessage('ride_responses', {
    type: 'RIDE_COMPLETED',
    timestamp: new Date().toISOString(),
    data: { rideId }
  });
};

// Billing handlers
const publishBillingCreated = async (billingData) => {
  return await sendMessage('billing_events', {
    type: 'BILLING_CREATED',
    timestamp: new Date().toISOString(),
    data: billingData
  });
};

const publishPaymentProcessed = async (billingId, status) => {
  return await sendMessage('billing_events', {
    type: 'PAYMENT_PROCESSED',
    timestamp: new Date().toISOString(),
    data: { billingId, status }
  });
};

// Driver status handlers
const publishDriverStatusChange = async (driverId, status, location) => {
  return await sendMessage('driver_events', {
    type: 'DRIVER_STATUS_CHANGED',
    timestamp: new Date().toISOString(),
    data: { driverId, status, location }
  });
};

// Customer handlers
const publishCustomerEvent = async (customerId, eventType, data) => {
  return await sendMessage('customer_events', {
    type: eventType,
    timestamp: new Date().toISOString(),
    data: { customerId, ...data }
  });
};

module.exports = {
  publishRideRequest,
  publishRideAccepted,
  publishRideRejected,
  publishRideCompleted,
  publishBillingCreated,
  publishPaymentProcessed,
  publishDriverStatusChange,
  publishCustomerEvent
};