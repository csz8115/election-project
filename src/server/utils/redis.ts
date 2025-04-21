import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

// Log all Redis client-level errors
redisClient.on('error', (err) => {
  console.error('[Redis Client Error]', err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log('[Redis] Connected successfully');
  } catch (err) {
    console.error('[Redis Connect Error]', err);
  }
})();

export const getRedisClient = () => redisClient;
