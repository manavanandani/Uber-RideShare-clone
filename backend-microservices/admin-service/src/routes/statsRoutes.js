const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../../../shared/utils/authMiddleware');
const { cacheMiddleware } = require('../config/redis');

// Admin-only routes
router.get('/revenue', authMiddleware(['admin']), cacheMiddleware(300), statsController.getRevenueStats);
router.get('/rides-by-area', authMiddleware(['admin']), cacheMiddleware(300), statsController.getRidesByAreaStats);
router.get('/graph-data', authMiddleware(['admin']), cacheMiddleware(300), statsController.getGraphData);
router.get('/performance-comparison', authMiddleware(['admin']), cacheMiddleware(3600), statsController.getPerformanceComparison);
router.get('/health', authMiddleware(['admin']), statsController.getSystemHealth);
router.get('/billing-summary', authMiddleware(['admin']), cacheMiddleware(300), statsController.getBillingStatsSummary);

module.exports = router;