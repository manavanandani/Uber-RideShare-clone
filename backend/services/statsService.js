const Ride = require('../models/Ride');
const Billing = require('../models/Billing');
const Driver = require('../models/Driver');
const Customer = require('../models/Customer');
const { redisClient } = require('../config/redis');

/**
 * Get revenue statistics by day
 */
const getRevenueByDay = async (startDate, endDate) => {
  try {
    // Try to get from cache first
    const cacheKey = `stats:revenue:${startDate}-${endDate}`;
    const cachedStats = await redisClient.get(cacheKey);
    
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
    
    // If not in cache, query database
    const stats = await Billing.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          totalRevenue: { $sum: "$total_amount" },
          rideCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Cache for 10 minutes
    await redisClient.set(cacheKey, JSON.stringify(stats), 'EX', 600);
    
    return stats;
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    throw error;
  }
};

/**
 * Get rides by area
 */
const getRidesByArea = async () => {
  try {
    // Try to get from cache first
    const cacheKey = 'stats:rides-by-area';
    const cachedStats = await redisClient.get(cacheKey);
    
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
    
    // If not in cache, query database
    const stats = await Billing.aggregate([
      {
        $group: {
          _id: "$source_location",
          rideCount: { $sum: 1 },
          totalRevenue: { $sum: "$total_amount" }
        }
      },
      { $sort: { rideCount: -1 } }
    ]);
    
    // Cache for 10 minutes
    await redisClient.set(cacheKey, JSON.stringify(stats), 'EX', 600);
    
    return stats;
  } catch (error) {
    console.error('Error getting area stats:', error);
    throw error;
  }
};

/**
 * Get rides by driver
 */
const getRidesByDriver = async () => {
  try {
    // Try to get from cache first
    const cacheKey = 'stats:rides-by-driver';
    const cachedStats = await redisClient.get(cacheKey);
    
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
    
    // If not in cache, query database
    const stats = await Billing.aggregate([
      {
        $group: {
          _id: "$driver_id",
          totalRides: { $sum: 1 },
          totalRevenue: { $sum: "$total_amount" }
        }
      },
      {
        $lookup: {
          from: 'drivers',
          localField: '_id',
          foreignField: 'driver_id',
          as: 'driver_info'
        }
      },
      {
        $project: {
          _id: 1,
          totalRides: 1,
          totalRevenue: 1,
          driver_name: {
            $concat: [
              { $arrayElemAt: ["$driver_info.first_name", 0] },
              " ",
              { $arrayElemAt: ["$driver_info.last_name", 0] }
            ]
          }
        }
      },
      { $sort: { totalRides: -1 } }
    ]);
    
    // Cache for 10 minutes
    await redisClient.set(cacheKey, JSON.stringify(stats), 'EX', 600);
    
    return stats;
  } catch (error) {
    console.error('Error getting driver stats:', error);
    throw error;
  }
};

/**
 * Get rides by customer
 */
const getRidesByCustomer = async () => {
  try {
    // Try to get from cache first
    const cacheKey = 'stats:rides-by-customer';
    const cachedStats = await redisClient.get(cacheKey);
    
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
    
    // If not in cache, query database
    const stats = await Billing.aggregate([
      {
        $group: {
          _id: "$customer_id",
          totalRides: { $sum: 1 },
          totalRevenue: { $sum: "$total_amount" }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: 'customer_id',
          as: 'customer_info'
        }
      },
      {
        $project: {
          _id: 1,
          totalRides: 1,
          totalRevenue: 1,
          customer_name: {
            $concat: [
              { $arrayElemAt: ["$customer_info.first_name", 0] },
              " ",
              { $arrayElemAt: ["$customer_info.last_name", 0] }
            ]
          }
        }
      },
      { $sort: { totalRides: -1 } }
    ]);
    
    // Cache for 10 minutes
    await redisClient.set(cacheKey, JSON.stringify(stats), 'EX', 600);
    
    return stats;
  } catch (error) {
    console.error('Error getting customer stats:', error);
    throw error;
  }
};

/**
 * Get ride statistics by location (heatmap data)
 */
const getRideStatsByLocation = async () => {
  try {
    // Try to get from cache first
    const cacheKey = 'stats:ride-stats-by-location';
    const cachedStats = await redisClient.get(cacheKey);
    
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
    
    // If not in cache, query database
    const stats = await Ride.aggregate([
      {
        $group: {
          _id: {
            lat: { $round: ['$pickup_location.latitude', 2] },
            lng: { $round: ['$pickup_location.longitude', 2] }
          },
          rideCount: { $sum: 1 }
        }
      },
      {
        $sort: { rideCount: -1 }
      }
    ]);
    
    // Cache for 10 minutes
    await redisClient.set(cacheKey, JSON.stringify(stats), 'EX', 600);
    
    return stats;
  } catch (error) {
    console.error('Error getting location stats:', error);
    throw error;
  }
};

/**
 * Generate performance data for different configurations
 */
const getPerformanceData = async () => {
  try {
    
    const testData = [
      { config: 'B', requestsPerSecond: 100, responseTime: 250, throughput: 80 },
      { config: 'B+S', requestsPerSecond: 500, responseTime: 50, throughput: 450 },
      { config: 'B+S+K', requestsPerSecond: 800, responseTime: 30, throughput: 750 }
    ];
    
    return testData;
  } catch (error) {
    console.error('Error generating performance data:', error);
    throw error;
  }
};

module.exports = {
  getRevenueByDay,
  getRidesByArea,
  getRidesByDriver,
  getRidesByCustomer,
  getRideStatsByLocation,
  getPerformanceData
};