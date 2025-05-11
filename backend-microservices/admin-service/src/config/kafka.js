const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'admin-service',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
});

module.exports = { kafka };