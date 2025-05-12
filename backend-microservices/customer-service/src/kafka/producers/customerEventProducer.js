const { kafka } = require('../../config/kafka');
const { KAFKA_TOPICS } = require('../../../shared/kafka/topics');
const { CompressionTypes } = require('kafkajs');
const { CustomError } = require('../../../shared/utils/errors');

// Manual validation
const validateCustomerEvent = (message) => {
  const { customer_id, event_type, data } = message;
  if (!customer_id || typeof customer_id !== 'string') {
    throw new CustomError('Invalid or missing customer_id', 400);
  }
  if (!event_type || !['CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_DELETED', 'CUSTOMER_UPLOADED_IMAGES'].includes(event_type)) {
    throw new CustomError('Invalid event_type', 400);
  }
  if (!data || typeof data !== 'object') {
    throw new CustomError('Invalid or missing data', 400);
  }
};

const producer = kafka.producer({
  maxInFlightRequests: 5,
  idempotent: true,
});

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (error) {
    console.error('Failed to connect Kafka producer:', error);
    throw error;
  }
};

const sendMessage = async ({ topic, message }) => {
  try {
    if (topic !== KAFKA_TOPICS.CUSTOMER_EVENTS) {
      throw new CustomError(`Unknown topic: ${topic}`, 400);
    }
    validateCustomerEvent(message);
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
      acks: 1,
      compression: CompressionTypes.GZIP,
    });
    console.log(`Message sent to ${topic}`);
  } catch (error) {
    console.error(`Failed to send message to ${topic}:`, error);
    try {
      await producer.send({
        topic: KAFKA_TOPICS.CUSTOMER_DLQ,
        messages: [
          {
            value: JSON.stringify({
              originalTopic: topic,
              message,
              error: error.message,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      console.log(`Message sent to DLQ for ${topic}`);
    } catch (dlqError) {
      console.error('Failed to send to DLQ:', dlqError);
    }
    throw error;
  }
};

const disconnectProducer = async () => {
  try {
    await producer.disconnect();
    console.log('Kafka producer disconnected');
  } catch (error) {
    console.error('Failed to disconnect Kafka producer:', error);
  }
};

module.exports = { connectProducer, sendMessage, disconnectProducer };