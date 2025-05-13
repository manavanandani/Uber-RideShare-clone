const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const { redisClient } = require('../config/redis');

const consumer = kafka.consumer({ groupId: 'ride-driver-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected for driver events in Ride service');
    await consumer.subscribe({ topic: KAFKA_TOPICS.DRIVER_EVENTS, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());
          console.log('Received driver event:', eventData);

          const { event_type, driver_id, status, location, first_name, last_name, phone, car_details, rating } = eventData;

          if (!driver_id) throw new CustomError('Missing driver_id in driver event', 400);

          if (event_type === 'DRIVER_UPDATED' || event_type === 'DRIVER_CREATED') {
            const driverData = {
              driver_id,
              status: status || 'unknown',
              location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
              first_name,
              last_name,
              phone,
              car_details,
              rating
            };
            await redisClient.set(`driver:${driver_id}`, JSON.stringify(driverData), 'EX', 3600); // 1-hour TTL
            console.log(`Cached driver data for ${driver_id}`);
          } else if (event_type === 'DRIVER_DELETED') {
            await redisClient.del(`driver:${driver_id}`);
            console.log(`Removed driver data for ${driver_id}`);
          }
        } catch (error) {
          console.error('Error processing driver event:', error);
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
    console.error('Failed to run driver event consumer:', error);
    throw new CustomError('Kafka driver event consumer setup failed', 500);
  }
};

module.exports = { runConsumer };