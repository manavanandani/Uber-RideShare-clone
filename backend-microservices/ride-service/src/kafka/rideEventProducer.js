const { kafka } = require('../config/kafka');
const { CustomError } = require('../../../shared/utils/errors');

let producer;

const connectProducer = async () => {
  try {
    if (!producer) {
      producer = kafka.producer();
      await producer.connect();
      console.log('Kafka producer connected for Ride service');
    }
  } catch (error) {
    console.error('Failed to connect Kafka producer:', error);
    throw new CustomError('Kafka producer connection failed', 500);
  }
};

const sendMessage = async ({ topic, message }) => {
  try {
    if (!producer) await connectProducer();
    await producer.send({
      topic,
      messages: [
        {
          key: message.key || null,
          value: JSON.stringify(message.value)
        }
      ]
    });
    console.log(`Message sent to ${topic}:`, message);
  } catch (error) {
    console.error(`Error sending message to ${topic}:`, error);
    throw new CustomError('Failed to send Kafka message', 500);
  }
};

module.exports = { connectProducer, sendMessage };