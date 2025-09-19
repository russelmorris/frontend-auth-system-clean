// Whitelist storage abstraction that works locally and on Vercel
import fs from 'fs/promises'
import path from 'path'

// Dynamic import for Vercel KV to avoid errors when not configured
let kv: any = null

async function getKV() {
  if (!kv && process.env.KV_REST_API_URL) {
    try {
      const kvModule = await import('@vercel/kv')
      kv = kvModule.kv
    } catch (error) {
      console.log('Vercel KV not available:', error)
    }
  }
  return kv
}

export class WhitelistStorage {
  private static WHITELIST_KEY = 'email-whitelist'
  private static LOCAL_FILE = 'whitelist.json'

  static async getWhitelist(): Promise<string[]> {
    // Try Vercel KV first (production)
    const kvInstance = await getKV()
    if (kvInstance) {
      try {
        console.log('Loading whitelist from Vercel KV')
        const whitelist = await kvInstance.get<string[]>(this.WHITELIST_KEY)
        return whitelist || []
      } catch (error) {
        console.error('Error reading from KV:', error)
      }
    }

    // Fall back to local file (development)
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
    // Try Vercel KV first (production)
    const kvInstance = await getKV()
    if (kvInstance) {
      try {
        console.log('Saving whitelist to Vercel KV')
        await kvInstance.set(this.WHITELIST_KEY, whitelist)
        return
      } catch (error) {
        console.error('Error saving to KV:', error)
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

  static isUsingKV(): boolean {
    return !!process.env.KV_REST_API_URL
  }
}