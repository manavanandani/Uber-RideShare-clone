const Redis = require('ioredis');

const createMockRedisClient = () => {
  const cache = new Map();
  return {
    get: async (key) => cache.get(key),
    set: async (key, value, expiryType, duration) => {
      cache.set(key, value);
      if (expiryType === 'EX') {
        setTimeout(() => cache.delete(key), duration * 1000);
      }
      return 'OK';
    },
    del: async (...keys) => {
      let count = 0;
      for (const key of keys) {
        if (cache.delete(key)) count++;
      }
      return count;
    },
  };
};

let redisClient;
try {
  redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
    redisClient = createMockRedisClient();
  });
  redisClient.ping().catch((err) => {
    console.error('Redis ping failed:', err);
    redisClient = createMockRedisClient();
  });
} catch (error) {
  console.error('Error creating Redis client:', error);
  redisClient = createMockRedisClient();
}

module.exports = { redis: redisClient };