const { producer } = require('../kafka');

// Function to publish driver status change event to Kafka
const publishDriverStatusChange = async (driverId, status, notes) => {
  try {
    await producer.send({
      topic: 'driver_events',
      messages: [
        {
          value: JSON.stringify({
            type: 'DRIVER_STATUS_CHANGED',
            timestamp: new Date().toISOString(),
            data: { driverId, status, notes }
          })
        }
      ]
    });
    console.log('Driver status change event sent');
  } catch (error) {
    console.error('Error sending driver status change event:', error);
  }
};

// Function to publish customer status change event to Kafka
const publishCustomerEvent = async (customerId, eventType, data) => {
  try {
    await producer.send({
      topic: 'customer_events',
      messages: [
        {
          value: JSON.stringify({
            type: eventType,
            timestamp: new Date().toISOString(),
            data: { customerId, ...data }
          })
        }
      ]
    });
    console.log('Customer status change event sent');
  } catch (error) {
    console.error('Error sending customer status change event:', error);
  }
};

module.exports = {
  publishDriverStatusChange,
  publishCustomerEvent
};
