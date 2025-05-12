const KAFKA_TOPICS = {
  // Customer topics
  CUSTOMER_EVENTS: 'customer.events',
  CUSTOMER_REVIEW_REQUEST: 'customer.review.request',
  CUSTOMER_DLQ: 'customer.events.dlq',
  // Admin topics
  ADMIN_EVENTS: 'admin.events',
  SYSTEM_STATS_REQUEST: 'system.stats.request',
  SYSTEM_STATS_RESPONSE: 'system.stats.response',
  ADMIN_DLQ: 'admin.events.dlq',
  // Driver topics
  DRIVER_REVIEW_REQUEST: 'driver.review.request',
  DRIVER_EVENTS: 'driver.events',
  DRIVER_DLQ: 'driver.events.dlq',
  // Billing topics
  BILLING_EVENTS: 'billing.events',
  BILLING_DLQ: 'billing.events.dlq',
  // Ride topics
  RIDE_EVENTS: 'ride.events'
};

module.exports = { KAFKA_TOPICS };