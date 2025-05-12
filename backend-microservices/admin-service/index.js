const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/database');
const { connectProducer } = require('./src/kafka/adminEventProducer');
const { runConsumer } = require('./src/kafka/statsResponseConsumer');
const adminRoutes = require('./src/routes/adminRoutes');
const authRoutes = require('./src/routes/authRoutes');
const { createAllTopics } = require('../shared/kafka/createAllTopics');

const app = express();

// CORS Setup
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Admin service OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Admin Microservice');
});

const startServer = async () => {
  try {
    await connectDB();
    await connectProducer();
    await runConsumer();
    await createAllTopics();
    console.log('Kafka producer and consumer for Admin service started');
    const port = process.env.SERVICE_PORT || 5001;
    app.listen(port, () => {
      console.log(`Admin service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start admin service:', error);
    setTimeout(startServer, 5000);
  }
};

startServer();