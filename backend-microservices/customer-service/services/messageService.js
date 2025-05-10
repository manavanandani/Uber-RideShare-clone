const { sendMessage } = require('./kafka');

// Publish customer event to Kafka
async function publishCustomerEvent(customerId, eventType, data) {
  const message = {
    customerId,
    eventType,
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    // Send the event message to the appropriate Kafka topic
    await sendMessage('customer-events', message);
    console.log(`Customer event ${eventType} published for customer ${customerId}`);
  } catch (error) {
    console.error(`Failed to publish customer event for customer ${customerId}:`, error);
  }
}

module.exports = {
  publishCustomerEvent,
};
