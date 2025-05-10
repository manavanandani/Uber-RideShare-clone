const { producer, consumer } = require('../config/kafka');

let statsCache = {
  driverCount: 0,
  customerCount: 0,
  rideCount: 0,
  billingCount: 0,
  recentReviews: [],
};

// Publisher
async function publishEvent(topic, payload) {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(payload) }],
  });
  await producer.disconnect();
}

// Kafka Message Handlers
function updateStats(data) {
  switch (data.type) {
    case 'driver':
      statsCache.driverCount = data.count;
      break;
    case 'customer':
      statsCache.customerCount = data.count;
      break;
    case 'ride':
      statsCache.rideCount = data.count;
      break;
    case 'billing':
      statsCache.billingCount = data.count;
      break;
    default:
      console.warn('Unknown stats type:', data.type);
  }
}

function handleReview(data) {
  statsCache.recentReviews.unshift(data);
  if (statsCache.recentReviews.length > 10) {
    statsCache.recentReviews.pop();
  }
}

// Consumer Setup
async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'admin-stats', fromBeginning: true });
  await consumer.subscribe({ topic: 'review-events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payload = JSON.parse(message.value.toString());

      if (topic === 'admin-stats') {
        updateStats(payload);
      } else if (topic === 'review-events') {
        handleReview(payload);
      }
    },
  });

  console.log('Kafka consumer listening...');
}

module.exports = {
  startConsumer,
  statsCache,
  publishEvent,
};
