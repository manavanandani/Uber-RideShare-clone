const dotenv = require('dotenv');
const express = require('express');
const databaseSelectorMiddleware = require('./middleware/databaseSelectorMiddleware');

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const cors = require('cors');
const { createClient: createRedisClient } = require('./config/redis');

const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const { startConsumer } = require('./services/messageService');

const app = express();

// CORS Setup
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(databaseSelectorMiddleware);

// MongoDB Connection
connectDB();

// Routes
app.use('/api/admins', adminRoutes);
app.use('/api/auth', authRoutes);

// Health Check 
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Admin service OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Admin Microservice');
});

// Kafka Consumer Initialization
startConsumer()
  .then(() => console.log('Kafka consumer for Admin service started'))
  .catch(err => {
    console.error('Kafka consumer startup failed:', err);
    process.exit(1);
  });

// Start Server 
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Admin Microservice running on port ${PORT}`);
});
