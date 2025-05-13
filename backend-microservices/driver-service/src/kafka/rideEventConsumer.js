const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CustomError } = require('../../../shared/utils/errors');
const { Driver } = require('../model/driver');

const consumer = kafka.consumer({ groupId: 'driver-ride-group' });

const runConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected for ride events in Driver service');
    await consumer.subscribe({ topic: KAFKA_TOPICS.RIDE_EVENTS, fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());
          console.log('Received ride event:', eventData);

          const { event_type, ride_id, driver_id } = eventData;

          if (!event_type || !ride_id || !driver_id) {
            throw new CustomError('Missing required event fields', 400);
          }

          // Process only RIDE_COMPLETED events for ride_history
          if (event_type !== 'RIDE_COMPLETED') {
            console.log(`Ignoring event type: ${event_type}`);
            return;
          }

          const driver = await Driver.findOne({ driver_id });
          if (!driver) {
            throw new CustomError('Driver not found', 404);
          }

          // Avoid duplicate ride_id in ride_history
          if (!driver.ride_history.includes(ride_id)) {
            driver.ride_history.push(ride_id);
            await driver.save();
            console.log(`Added ride ${ride_id} to driver ${driver_id} ride_history`);
          } else {
            console.log(`Ride ${ride_id} already in driver ${driver_id} ride_history`);
          }
        } catch (error) {
          console.error('Error processing ride event:', error);
          try {
            await kafka.producer().send({
              topic: KAFKA_TOPICS.DRIVER_DLQ,
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
            console.log('Error message sent to DLQ');
          } catch (dlqError) {
            console.error('Error sending to DLQ:', dlqError);
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