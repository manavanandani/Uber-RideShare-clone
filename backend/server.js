const express = require('express');
const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./config/db');

const { kafka } = require('./config/kafka');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();


async function createKafkaTopics() {
  const admin = kafka.admin();
  
  try {
    await admin.connect();
    console.log('Kafka admin connected');
    
    // Get existing topics first
    const existingTopics = await admin.listTopics();
    
    // Define topics to create
    const topics = [
      { topic: 'ride_requests', numPartitions: 3, replicationFactor: 1 },
      { topic: 'ride_responses', numPartitions: 3, replicationFactor: 1 },
      { topic: 'billing_events', numPartitions: 3, replicationFactor: 1 },
      { topic: 'driver_events', numPartitions: 3, replicationFactor: 1 },
      { topic: 'customer_events', numPartitions: 3, replicationFactor: 1 }
    ];
    
    // Filter out existing topics
    const topicsToCreate = topics.filter(t => !existingTopics.includes(t.topic));
    
    if (topicsToCreate.length > 0) {
      // Create only new topics
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true
      });
      console.log('New Kafka topics created successfully:', topicsToCreate.map(t => t.topic));
    } else {
      console.log('All Kafka topics already exist');
    }
    
  } catch (error) {
    console.error('Error managing Kafka topics:', error);
  } finally {
    await admin.disconnect();
  }
}


// Call this function when your app starts
createKafkaTopics().catch(console.error);


// Set port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});