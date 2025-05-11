const { kafka } = require('../../config/kafka');
const { KAFKA_TOPICS } = require('../topics');
const { CompressionTypes } = require('kafkajs');
const { CustomError } = require('../../../shared/utils/errors');

// Manual validation functions
const validateDriverReview = (message) => {
  const { driver_id, status, notes, reviewed_by, review_date } = message;
  if (!driver_id || typeof driver_id !== 'string') {
    throw new CustomError('Invalid or missing driver_id', 400);
  }
  if (!status || !['approved', 'rejected', 'pending_review'].includes(status)) {
    throw new CustomError('Invalid status. Must be "approved", "rejected", or "pending_review"', 400);
  }
  if (notes && typeof notes !== 'string') {
    throw new CustomError('Invalid notes. Must be a string', 400);
  }
  if (!reviewed_by || typeof reviewed_by !== 'string') {
    throw new CustomError('Invalid or missing reviewed_by', 400);
  }
  if (!review_date || isNaN(Date.parse(review_date))) {
    throw new CustomError('Invalid or missing review_date', 400);
  }
};

const validateCustomerReview = (message) => {
  const { customer_id, status, notes, reviewed_by, review_date } = message;
  if (!customer_id || typeof customer_id !== 'string') {
    throw new CustomError('Invalid or missing customer_id', 400);
  }
  if (!status || !['approved', 'suspended', 'active'].includes(status)) {
    throw new CustomError('Invalid status. Must be "approved", "suspended", or "active"', 400);
  }
  if (notes && typeof notes !== 'string') {
    throw new CustomError('Invalid notes. Must be a string', 400);
  }
  if (!reviewed_by || typeof reviewed_by !== 'string') {
    throw new CustomError('Invalid or missing reviewed_by', 400);
  }
  if (!review_date || isNaN(Date.parse(review_date))) {
    throw new CustomError('Invalid or missing review_date', 400);
  }
};

const validateSystemStats = (message) => {
  const { correlationId } = message;
  if (!correlationId || typeof correlationId !== 'string') {
    throw new CustomError('Invalid or missing correlationId', 400);
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
    // Manual validation based on topic
    if (topic === KAFKA_TOPICS.DRIVER_REVIEW_REQUEST) {
      validateDriverReview(message);
    } else if (topic === KAFKA_TOPICS.CUSTOMER_REVIEW_REQUEST) {
      validateCustomerReview(message);
    } else if (topic === KAFKA_TOPICS.SYSTEM_STATS_REQUEST) {
      validateSystemStats(message);
    } else {
      throw new CustomError(`Unknown topic: ${topic}`, 400);
    }

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
        topic: KAFKA_TOPICS.DEAD_LETTER_QUEUE,
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