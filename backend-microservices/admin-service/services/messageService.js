const { producer, consumer } = require('../config/kafka');
const { v4: uuidv4 } = require('uuid');

// In-memory map to track pending requests
const pendingRequests = new Map();
let isConsumerInitialized = false;
const responseTopic = 'admin_stats_responses';

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

// Init Kafka consumer (once)
const initConsumer = async () => {
  if (isConsumerInitialized) return;
  await consumer.connect();
  await consumer.subscribe({ topic: responseTopic, fromBeginning: false });

  consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const parsed = JSON.parse(message.value.toString());
        const { correlationId, data } = parsed;
        const resolve = pendingRequests.get(correlationId);
        if (resolve) {
          resolve(data);
          pendingRequests.delete(correlationId);
        }
      } catch (err) {
        console.error('Error handling stats response:', err);
      }
    }
  });

  isConsumerInitialized = true;
};

// Function to request system stats from other services
const requestSystemStats = async (topic) => {
  await initConsumer();

  const correlationId = uuidv4();

  const payload = {
    type: topic.replace('_request', '_response'), // Just for convention
    correlationId
  };

  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(payload)
      }
    ]
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(correlationId);
      reject(new Error(`Timeout waiting for stats from topic ${topic}`));
    }, 5000);

    pendingRequests.set(correlationId, (data) => {
      clearTimeout(timeout);
      resolve(data);
    });
  });
};


module.exports = {
  publishDriverStatusChange,
  publishCustomerEvent,
  requestSystemStats
};
