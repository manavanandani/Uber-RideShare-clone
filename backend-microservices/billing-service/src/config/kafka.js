const { Kafka } = require('kafkajs');

// Kafka configuration for customer-service
const kafka = new Kafka({
  clientId: 'billing-service',
  brokers: ['kafka:9092'], 
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'billing-group' });

module.exports = { kafka, producer, consumer };
