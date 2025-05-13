const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('connect', () => {
  console.log('Redis client connected for Admin service');
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

const cacheMiddleware = (ttl) => async (req, res, next) => {
  const cacheKey = `admin:${req.method}:${req.originalUrl}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }
    res.originalJson = res.json;
    res.json = async (body) => {
      await redisClient.set(cacheKey, JSON.stringify(body), 'EX', ttl);
      res.originalJson(body);
    };
    next();
  } catch (err) {
    console.error('Redis cache error:', err);
    next();
  }
};

const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(`admin:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`Invalidated cache keys: ${keys}`);
    }
  } catch (err) {
    console.error('Error invalidating cache:', err);
  }
};

module.exports = { redisClient, cacheMiddleware, invalidateCache };