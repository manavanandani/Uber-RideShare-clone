const { Kafka } = require('kafkajs');
const dotenv = require('dotenv');

dotenv.config();

const kafka = new Kafka({
  clientId: 'uber-simulation',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'uber-simulation-group' });

const initKafka = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
    
    await consumer.connect();
    console.log('Kafka consumer connected');
    
    await consumer.subscribe({ topics: [
      'ride_requests',
      'ride_responses',
      'billing_events',
      'driver_events',
      'customer_events'
    ] });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageValue = JSON.parse(message.value.toString());
        console.log(`Received message from topic ${topic}:`, messageValue);
        
        switch (topic) {
          case 'ride_requests':
            break;
          case 'ride_responses':
            break;
          case 'billing_events':
            break;
          case 'driver_events':
            break;
          case 'customer_events':
            break;
          default:
            console.log(`No handler for topic ${topic}`);
        }
      },
    });
  } catch (error) {
    console.error('Error connecting to Kafka:', error);
  }
};

const sendMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) }
      ],
    });
    return true;
  } catch (error) {
    console.error(`Error sending message to topic ${topic}:`, error);
    return false;
  }
};

module.exports = {
  kafka,
  producer,
  consumer,
  initKafka,
  sendMessage
};