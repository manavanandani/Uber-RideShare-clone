const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const { redisClient } = require('../config/redis');

const consumer = kafka.consumer({ groupId: 'admin-billing-stats-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected for billing events in Admin service');
    await consumer.subscribe({ topic: KAFKA_TOPICS.BILLING_EVENTS, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());
          console.log('Received billing event:', eventData);

          const { event_type, billing_id, amount, status, created_at } = eventData;

          if (event_type === 'BILLING_CREATED' && status === 'completed') {
            const date = new Date(created_at).toISOString().split('T')[0];
            const billingStatsKey = `billing_stats:${date}`;
            await redisClient.incrByFloat(billingStatsKey, amount);
            await redisClient.expire(billingStatsKey, 30 * 24 * 3600); // 30 days TTL
          }
        } catch (error) {
          console.error('Error processing billing event:', error);
          try {
            await kafka.producer().send({
              topic: KAFKA_TOPICS.ADMIN_DLQ,
              messages: [
                {
                  key: message.key || null,
                  value: JSON.stringify({
                    originalTopic: topic,
                    originalMessage: message.value.toString(),
                    error: error.message,
                    timestamp: new Date().toISOString()
                  })
                }
              ]
            });
            console.log('Error message sent to ADMIN_DLQ');
          } catch (dlqError) {
            console.error('Error sending to ADMIN_DLQ:', dlqError);
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to run billing event consumer:', error);
    throw new CustomError('Kafka billing event consumer setup failed', 500);
  }
};

module.exports = { runConsumer };