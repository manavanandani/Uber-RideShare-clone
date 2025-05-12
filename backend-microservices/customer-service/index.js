const express = require('express');
const cors = require('cors');
const connectDB  = require('./src/config/database');
const { connectProducer } = require('./src/kafka/customerEventProducer');
const { runConsumer } = require('./src/kafka/customerReviewConsumer');
const authRoutes = require('./src/routes/authRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const { CustomError } = require('../shared/utils/errors');

const app = express();

// CORS Setup
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Customer service OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Customer Microservice');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err instanceof CustomError ? err.status : 500;
  res.status(status).json({ message: err.message });
});

const startServer = async () => {
  try {
    await connectDB();
    await createAllTopics(); // Create Kafka topics
    await connectProducer();
    await runConsumer();
    console.log('Kafka producer, consumer, and topics for Customer service initialized');
    const port = process.env.SERVICE_PORT || 5003;
    app.listen(port, () => {
      console.log(`Customer service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start customer service:', error);
    setTimeout(startServer, 5000);
  }
};

startServer();