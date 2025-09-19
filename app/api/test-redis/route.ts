import { NextRequest, NextResponse } from 'next/server'
import { getRedisClient } from '@/lib/redis-client'

export async function GET(req: NextRequest) {
  try {
    const redis = getRedisClient()

    if (!redis) {
      return NextResponse.json({
        status: 'error',
        message: 'Redis not configured. Check REDIS_URL environment variable.'
      }, { status: 500 })
    }

    // Test connection
    await redis.ping()

    // Test write
    await redis.set('test-key', 'test-value')

    // Test read
    const value = await redis.get('test-key')

    // Clean up
    await redis.del('test-key')

    return NextResponse.json({
      status: 'success',
      message: 'Redis connection successful!',
      testValue: value,
      redisUrl: process.env.REDIS_URL ? 'Configured' : 'Not configured'
    })
  } catch (error) {
    console.error('Redis test error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Redis connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}