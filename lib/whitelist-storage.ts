// Whitelist storage abstraction that works locally and on Vercel/Redis
import fs from 'fs/promises'
import path from 'path'
import { getRedisClient } from './redis-client'

export class WhitelistStorage {
  private static WHITELIST_KEY = 'email-whitelist'
  private static LOCAL_FILE = 'whitelist.json'

  static async getWhitelist(): Promise<string[]> {
    // Try Redis first (production)
    const redis = getRedisClient()
    if (redis) {
      try {
        console.log('Loading whitelist from Redis')
        const data = await redis.get(this.WHITELIST_KEY)
        if (data) {
          const whitelist = JSON.parse(data)
          return Array.isArray(whitelist) ? whitelist : []
        }

        // If no data in Redis, try to migrate from local file
        console.log('No data in Redis, checking for local file to migrate...')
        const localWhitelist = await this.loadFromFile()
        if (localWhitelist.length > 0) {
          console.log('Migrating local whitelist to Redis...')
          await this.saveWhitelist(localWhitelist)
          return localWhitelist
        }
      } catch (error) {
        console.error('Error reading from Redis:', error)
      }
    }

    // Fall back to local file (development)
    return this.loadFromFile()
  }

  private static async loadFromFile(): Promise<string[]> {
    try {
      console.log('Loading whitelist from local file')
      const whitelistPath = path.join(process.cwd(), this.LOCAL_FILE)
      const data = await fs.readFile(whitelistPath, 'utf8')
      const parsed = JSON.parse(data)
      return parsed.approvedEmails || []
    } catch (error) {
      console.log('No local whitelist file found, returning default')
      // Return default whitelist if nothing else works
      return [
        'russ@skyeam.com.au',
        'russel.d.j.morris@gmail.com',
        'info@consultai.com.au'
      ]
    }
  }

  static async addEmail(email: string, addedBy?: string): Promise<boolean> {
    const whitelist = await this.getWhitelist()
    const emailLower = email.toLowerCase().trim()

    if (whitelist.includes(emailLower)) {
      return false // Already exists
    }

    whitelist.push(emailLower)
    await this.saveWhitelist(whitelist)
    return true
  }

  static async removeEmail(email: string): Promise<boolean> {
    const whitelist = await this.getWhitelist()
    const emailLower = email.toLowerCase().trim()
    const index = whitelist.indexOf(emailLower)

    if (index === -1) {
      return false // Doesn't exist
    }

    whitelist.splice(index, 1)
    await this.saveWhitelist(whitelist)
    return true
  }

  private static async saveWhitelist(whitelist: string[]): Promise<void> {
    // Try Redis first (production)
    const redis = getRedisClient()
    if (redis) {
      try {
        console.log('Saving whitelist to Redis')
        await redis.set(this.WHITELIST_KEY, JSON.stringify(whitelist))
        return
      } catch (error) {
        console.error('Error saving to Redis:', error)
      }
    }

    // Fall back to local file (development)
    try {
      console.log('Saving whitelist to local file')
      const whitelistPath = path.join(process.cwd(), this.LOCAL_FILE)
      const data = {
        approvedEmails: whitelist,
        lastUpdated: new Date().toISOString()
      }
      await fs.writeFile(whitelistPath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error saving to local file:', error)
      throw new Error('Unable to save whitelist')
    }
  }

  static isUsingRedis(): boolean {
    return !!getRedisClient()
  }
}