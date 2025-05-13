const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const { connectProducer } = require('./src/kafka/rideEventProducer');
const { runConsumer: runStatsConsumer } = require('./src/kafka/systemStatsConsumer');
const { runConsumer: runDriverConsumer } = require('./src/kafka/driverEventConsumer');
const { runConsumer: runCustomerConsumer } = require('./src/kafka/customerEventConsumer');
const rideRoutes = require('./src/routes/rideRoutes');
const { CustomError } = require('../shared/utils/errors');

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/rides', rideRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Ride service OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Ride Microservice');
});

app.use((err, req, res, next) => {
  const status = err instanceof CustomError ? err.status : 500;
  res.status(status).json({ message: err.message });
});

const startServer = async () => {
  try {
    await connectDB();
    await connectProducer();
    await runStatsConsumer();
    await runDriverConsumer();
    await runCustomerConsumer();
    console.log('Kafka producer, consumers, and topics for Ride service initialized');
    const port = process.env.SERVICE_PORT || 5003;
    app.listen(port, () => {
      console.log(`Ride service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start ride service:', error);
  }
};

startServer();