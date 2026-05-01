const Redis = require('ioredis');

function createMemoryClient() {
  return {
    isReady: false,
    async get() {
      return null;
    },
    async setex() {
      return 'OK';
    },
    async del() {
      return 0;
    },
    async keys() {
      return [];
    }
  };
}

if (!process.env.REDIS_URL) {
  console.log('Redis is disabled: REDIS_URL is not set');
  module.exports = createMemoryClient();
  return;
}

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times > 3) {
      return null;
    }

    return Math.min(times * 200, 1000);
  }
});

redis.isReady = false;

redis.on('connect', () => {
  redis.isReady = true;
  console.log('Redis connected');
});

redis.on('error', (err) => {
  redis.isReady = false;
  console.error('Redis error:', err.message);
});

module.exports = redis;
