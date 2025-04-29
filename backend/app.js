// app.js
const express = require('express');
const cors = require('cors');

const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');
const billingRoutes = require('./routes/billingRoutes');
const customerRoutes = require('./routes/customerRoutes');
const rideRoutes = require('./routes/rideRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const statsRoutes = require('./routes/statsRoutes');
const authRoutes = require('./routes/authRoutes'); // Add this

const { initKafka } = require('./config/kafka');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Kafka
initKafka().catch(err => {
  console.error('Failed to initialize Kafka:', err);
});

// Routes
app.use('/api/auth', authRoutes); // Add this
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