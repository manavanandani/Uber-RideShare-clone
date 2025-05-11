const { kafka } = require('../../config/kafka');
const { KAFKA_TOPICS } = require('../topics');
const { redis } = require('../../config/redis');

const consumer = kafka.consumer({ groupId: 'admin-stats-consumer' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected');
    await consumer.subscribe({ topic: KAFKA_TOPICS.SYSTEM_STATS_RESPONSE, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value);
          const { correlationId, stats } = data;
          if (!correlationId || !stats) {
            console.error('Invalid stats response:', data);
            return;
          }
          await redis.set(`stats:${correlationId}`, JSON.stringify(stats), 'EX', 30);
          console.log(`Stored stats for correlationId ${correlationId} in Redis`);
        } catch (error) {
          console.error('Error processing stats response:', error);
        }
      },
    });
  } catch (error) {
    console.error('Failed to run Kafka consumer:', error);
  }
};

const disconnectConsumer = async () => {
  try {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  } catch (error) {
    console.error('Failed to disconnect Kafka consumer:', error);
  }
};

module.exports = { runConsumer, disconnectConsumer };