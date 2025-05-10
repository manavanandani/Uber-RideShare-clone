const { Kafka } = require('kafkajs');

// Kafka client configuration
const kafka = new Kafka({
  clientId: 'customer-service', // Use a unique client id
  brokers: ['kafka:9092'], // The broker list, adjust this to your Kafka service configuration
});

// Create a producer instance
const producer = kafka.producer();


async function connectProducer() {
  await producer.connect();
}

async function sendMessage(topic, message) {
  try {
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
    console.log(`Message sent to ${topic}`);
  } catch (error) {
    console.error(`Error sending message to ${topic}:`, error);
  }
}

module.exports = {
  connectProducer,
  sendMessage,
};
