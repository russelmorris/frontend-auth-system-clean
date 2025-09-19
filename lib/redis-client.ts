import Redis from 'ioredis'

let redis: Redis | null = null

export function getRedisClient(): Redis | null {
  if (redis) return redis

  const redisUrl = process.env.REDIS_URL || process.env.KV_URL

  if (!redisUrl) {
    console.log('No Redis URL found in environment variables')
    return null
  }

  try {
    console.log('Connecting to Redis...')
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 retries')
          return null // Stop retrying
        }
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY'
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true
        }
        return false
      }
    })

    redis.on('connect', () => {
      console.log('Connected to Redis successfully')
    })

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    return redis
  } catch (error) {
    console.error('Failed to create Redis client:', error)
    return null
  }
}

export async function closeRedisClient(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
  }
}