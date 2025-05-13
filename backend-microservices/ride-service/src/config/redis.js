const Redis = require('ioredis');
const { CustomError } = require('../../../shared/utils/errors');

const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

const cacheMiddleware = (seconds) => async (req, res, next) => {
  const key = `cache:${req.originalUrl}`;
  try {
    const cached = await redis.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    res.sendResponse = res.json;
    res.json = (body) => {
      redis.setex(key, seconds, JSON.stringify(body));
      res.sendResponse(body);
    };
    next();
  } catch (error) {
    console.error('Redis cache error:', error);
    next();
  }
};

const invalidateCache = async (pattern) => {
  try {
    const keys = await redis.keys(`${pattern}*`);
    if (keys.length > 0) {
      await redis.del(keys);
      console.log(`Invalidated cache keys: ${keys}`);
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
    throw new CustomError('Cache invalidation failed', 500);
  }
};

module.exports = { redis, cacheMiddleware, invalidateCache };