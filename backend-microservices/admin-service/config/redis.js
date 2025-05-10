const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

// Create a mock Redis client that doesn't fail if Redis is unavailable
const createMockRedisClient = () => {
  const cache = new Map();
  
  return {
    get: async (key) => {
      console.log('Mock Redis: Getting key', key);
      return cache.get(key);
    },
    set: async (key, value, expiryType, duration) => {
      console.log('Mock Redis: Setting key', key);
      cache.set(key, value);
      if (expiryType === 'EX') {
        setTimeout(() => cache.delete(key), duration * 1000);
      }
      return 'OK';
    },
    rpush: async (key, value) => {
      console.log('Mock Redis: Pushing to list', key);
      const list = cache.get(key) || [];
      list.push(value);
      cache.set(key, list);
      return list.length;
    },
    keys: async (pattern) => {
      console.log('Mock Redis: Listing keys with pattern', pattern);
      return Array.from(cache.keys()).filter(key => 
        pattern === '*' || key.includes(pattern.replace('*', '')));
    },
    del: async (...keys) => {
      console.log('Mock Redis: Deleting keys', keys);
      let count = 0;
      for (const key of keys) {
        if (cache.delete(key)) count++;
      }
      return count;
    }
  };
};

let redisClient;
try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    connectTimeout: 5000,  // 5 seconds
    maxRetriesPerRequest: 3
  });
  
  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
    console.log('Switching to mock Redis client');
    redisClient = createMockRedisClient();
  });
  
  // Test connection
  redisClient.ping().catch(err => {
    console.error('Redis ping failed:', err);
    console.log('Switching to mock Redis client');
    redisClient = createMockRedisClient();
  });
} catch (error) {
  console.error('Error creating Redis client:', error);
  console.log('Using mock Redis client instead');
  redisClient = createMockRedisClient();
}

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    try {
      // Skip caching for testing scenarios
      if (req.headers['x-disable-cache'] === 'true') {
        return next();
      }
      
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Generate a unique cache key based on URL and any query parameters
      const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
      const key = `__cache__${req.originalUrl}__${req.user ? req.user.role : 'anonymous'}`;

      try {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
          console.log(`Cache hit for ${req.originalUrl}`);
          
          // For endpoints that return lists of users, add a check to filter deleted profiles
          if (req.originalUrl.includes('/drivers') || req.originalUrl.includes('/customers')) {
            try {
              // Parse cached data
              const parsedData = JSON.parse(cachedData);
              
              // If data is an array, filter out deleted profiles
              if (parsedData.data && Array.isArray(parsedData.data)) {
                parsedData.data = parsedData.data.filter(item => !item.is_deleted);
                return res.json(parsedData);
              }
            } catch (filterError) {
              console.error('Error filtering deleted profiles from cache:', filterError);
            }
          }
          
          return res.json(JSON.parse(cachedData));
        }
      } catch (cacheError) {
        console.error('Cache retrieval error:', cacheError);
      }

      // Capture the original send to intercept the response
      const originalSend = res.send;
      res.send = function (body) {
        if (res.statusCode === 200) {
          try {
            // Only cache successful responses
            redisClient.set(key, body, 'EX', duration);
          } catch (cacheError) {
            console.error('Cache set error:', cacheError);
          }
        }
        originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Redis cache middleware error:', error);
      next();
    }
  };
};

const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return false;
  }
};

module.exports = {
  redisClient,
  cacheMiddleware,
  invalidateCache
};