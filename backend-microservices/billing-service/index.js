const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const { connectProducer } = require('./src/kafka/billingEventProducer');
const { runConsumer: runRideEventConsumer } = require('./src/kafka/rideEventConsumer');
const { runConsumer: runSystemStatsConsumer } = require('./src/kafka/systemStatsConsumer');
const billingRoutes = require('./src/routes/billingRoutes');
const { CustomError } = require('../../shared/utils/errors');

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/billing', billingRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Billing service OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Billing Microservice');
});

app.use((err, req, res, next) => {
  const status = err instanceof CustomError ? err.status : 500;
  res.status(status).json({ message: err.message });
});

const startServer = async () => {
  try {
    await connectDB();
    await connectProducer();
    await runRideEventConsumer();
    await runSystemStatsConsumer();
    console.log('Kafka producer, consumers, and topics for Billing service initialized');
    const port = process.env.SERVICE_PORT || 5005;
    app.listen(port, () => {
      console.log(`Billing service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start billing service:', error);
    setTimeout(startServer, 5000);
  }
};

startServer();