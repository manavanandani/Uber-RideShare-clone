const { Kafka } = require('kafkajs');

// Kafka configuration for customer-service
const kafka = new Kafka({
  clientId: 'driver-service',
  brokers: ['kafka:9092'], 
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'driver-group' });

module.exports = { kafka, producer, consumer };
