const express = require('express');
const cors = require('cors');
const databaseSelectorMiddleware = require('./middleware/databaseSelectorMiddleware');

const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const billingRoutes = require('./routes/billingRoutes');
const customerRoutes = require('./routes/customerRoutes');
const rideRoutes = require('./routes/rideRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const statsRoutes = require('./routes/statsRoutes');
const authRoutes = require('./routes/authRoutes');

const { initKafka } = require('./config/kafka');

const app = express();

const corsOptions = {
  //origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // This allows cookies/authentication
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

app.use(databaseSelectorMiddleware);

// Initialize Kafka
initKafka().catch(err => {
  console.error('Failed to initialize Kafka:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('Welcome to the Ride Sharing App!');
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: '404: Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '500: Something broke!' });
});

module.exports = app;