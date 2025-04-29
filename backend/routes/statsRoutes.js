// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const verifyRole = require('../middleware/verifyRole');
const { cacheMiddleware } = require('../config/redis');

// Admin only routes
router.get('/revenue', verifyRole('admin'), cacheMiddleware(300), statsController.getRevenueStats);
router.get('/rides-by-area', verifyRole('admin'), cacheMiddleware(300), statsController.getRidesByAreaStats);
router.get('/graph-data', verifyRole('admin'), cacheMiddleware(300), statsController.getGraphData);
router.get('/performance-comparison', verifyRole('admin'), cacheMiddleware(3600), statsController.getPerformanceComparison);
router.get('/health', verifyRole('admin'), statsController.getSystemHealth);

module.exports = router;