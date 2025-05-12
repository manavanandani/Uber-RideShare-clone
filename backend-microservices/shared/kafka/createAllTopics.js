const { Kafka } = require('kafkajs');
const { KAFKA_TOPICS } = require('./topics');
const { CustomError } = require('../utils/errors');

const createAllTopics = async () => {
  const kafka = new Kafka({
    clientId: 'shared-topic-creator',
    brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(',')
  });
  const admin = kafka.admin();
  try {
    await admin.connect();
    console.log('Kafka admin connected');

    const existingTopics = await admin.listTopics();
    const topicsToCreate = [
      { topic: KAFKA_TOPICS.CUSTOMER_EVENTS, numPartitions: 3, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.CUSTOMER_REVIEW_REQUEST, numPartitions: 3, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.CUSTOMER_DLQ, numPartitions: 1, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.ADMIN_EVENTS, numPartitions: 3, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.SYSTEM_STATS_REQUEST, numPartitions: 1, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.SYSTEM_STATS_RESPONSE, numPartitions: 1, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.ADMIN_DLQ, numPartitions: 1, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.DRIVER_REVIEW_REQUEST, numPartitions: 3, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.DRIVER_EVENTS, numPartitions: 3, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.DRIVER_DLQ, numPartitions: 1, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.BILLING_EVENTS, numPartitions: 3, replicationFactor: 1 },
      { topic: KAFKA_TOPICS.BILLING_DLQ, numPartitions: 1, replicationFactor: 1 }
    ];

    const topicsNeeded = topicsToCreate.filter(
      (topicConfig) => !existingTopics.includes(topicConfig.topic)
    );

    if (topicsNeeded.length > 0) {
      await admin.createTopics({
        topics: topicsNeeded,
        waitForLeaders: true
      });
      console.log('Created topics:', topicsNeeded.map(t => t.topic));
    } else {
      console.log('All topics already exist');
    }
  } catch (error) {
    console.error('Failed to create topics:', error);
    throw new CustomError('Topic creation failed', 500);
  } finally {
    await admin.disconnect();
    console.log('Kafka admin disconnected');
  }
};

module.exports = { createAllTopics };