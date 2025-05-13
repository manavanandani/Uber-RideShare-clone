const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const { redisClient } = require('../config/redis');

const consumer = kafka.consumer({ groupId: 'ride-customer-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected for customer events in Ride service');
    await consumer.subscribe({ topic: KAFKA_TOPICS.CUSTOMER_EVENTS, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());
          console.log('Received customer event:', eventData);

          const { event_type, customer_id, first_name, last_name, phone, rating } = eventData;

          if (!customer_id) throw new CustomError('Missing customer_id in customer event', 400);

          if (event_type === 'CUSTOMER_UPDATED' || event_type === 'CUSTOMER_CREATED') {
            const customerData = {
              customer_id,
              first_name,
              last_name,
              phone,
              rating
            };
            await redisClient.set(`customer:${customer_id}`, JSON.stringify(customerData), 'EX', 3600); // 1-hour TTL
            console.log(`Cached customer data for ${customer_id}`);
          } else if (event_type === 'CUSTOMER_DELETED') {
            await redisClient.del(`customer:${customer_id}`);
            console.log(`Removed customer data for ${customer_id}`);
          }
        } catch (error) {
          console.error('Error processing customer event:', error);
          try {
            await kafka.producer().send({
              topic: KAFKA_TOPICS.RIDE_DLQ,
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
            console.log('Error message sent to RIDE_DLQ');
          } catch (dlqError) {
            console.error('Error sending to RIDE_DLQ:', dlqError);
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to run customer event consumer:', error);
    throw new CustomError('Kafka customer event consumer setup failed', 500);
  }
};

module.exports = { runConsumer };