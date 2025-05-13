const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const { redisClient } = require('../config/redis');

const consumer = kafka.consumer({ groupId: 'admin-ride-stats-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected for ride events in Admin service');
    await consumer.subscribe({ topic: KAFKA_TOPICS.RIDE_EVENTS, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());
          console.log('ReceivedRide event:', eventData);

          const { event_type, ride_id, customer_id, driver_id, fare_amount, date_time, status } = eventData;

          if (event_type === 'RIDE_COMPLETED') {
            const date = new Date(date_time).toISOString().split('T')[0];
            const revenueKey = `revenue:${date}`;
            await redisClient.incrByFloat(revenueKey, fare_amount);
            await redisClient.expire(revenueKey, 30 * 24 * 3600); // 30 days TTL

            const ridesByCustomerKey = `rides_by_customer:${customer_id}`;
            await redisClient.incr(ridesByCustomerKey);
            await redisClient.expire(ridesByCustomerKey, 30 * 24 * 3600);

            if (driver_id) {
              const ridesByDriverKey = `rides_by_driver:${driver_id}`;
              await redisClient.incr(ridesByDriverKey);
              await redisClient.expire(ridesByDriverKey, 30 * 24 * 3600);
            }
          }
        } catch (error) {
          console.error('Error processing ride event:', error);
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
    console.error('Failed to run ride event consumer:', error);
    throw new CustomError('Kafka ride event consumer setup failed', 500);
  }
};

module.exports = { runConsumer };