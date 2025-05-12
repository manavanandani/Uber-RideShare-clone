const { kafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/config');
const { CustomError } = require('../../../shared/utils/errors');

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected for Driver service');
  } catch (error) {
    console.error('Failed to connect Kafka producer:', error);
    throw new CustomError('Kafka producer connection failed', 500);
  }
};

const sendMessage = async ({ topic, message }) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: message.driver_id || null,
          value: JSON.stringify(message)
        }
      ]
    });
    console.log(`Message sent to ${topic}:`, message);
  } catch (error) {
    console.error(`Error sending message to ${topic}:`, error);
    try {
      await producer.send({
        topic: KAFKA_TOPICS.DRIVER_DLQ,
        messages: [
          {
            key: message.driver_id || null,
            value: JSON.stringify({
              originalTopic: topic,
              message,
              error: error.message,
              timestamp: new Date().toISOString()
            })
          }
        ]
      });
      console.log('Message sent to DLQ:', message);
    } catch (dlqError) {
      console.error('Error sending to DLQ:', dlqError);
      throw new CustomError('Failed to send message to DLQ', 500);
    }
    throw new CustomError(`Failed to send message to ${topic}`, 500);
  }
};

module.exports = { connectProducer, sendMessage };