const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const { connectProducer } = require('./src/kafka/driverEventProducer');
const { runConsumer: runReviewConsumer } = require('./src/kafka/driverReviewConsumer');
const { runConsumer: runRideEventConsumer } = require('./src/kafka/rideEventConsumer');
const driverRoutes = require('./src/routes/driverRoutes');
const authRoutes = require('./src/routes/authRoutes');
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
app.use('/api/driver', driverRoutes);
app.use('/api/driver', authRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Driver service OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Driver Microservice');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err instanceof CustomError ? err.status : 500;
  res.status(status).json({ message: err.message });
});

const startServer = async () => {
  try {
    await connectDB();
    await connectProducer();
    await runReviewConsumer();
    await runRideEventConsumer();
    console.log('Kafka producer, consumers, and topics for Driver service initialized');
    const port = process.env.SERVICE_PORT || 5003;
    app.listen(port, () => {
      console.log(`Driver service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start driver service:', error);
    setTimeout(startServer, 5000);
  }
};

startServer();