import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import fs from 'fs/promises'
import path from 'path'

// Admin emails who can manage the whitelist
const ADMIN_EMAILS = ['russ@skyeam.com.au', 'russel.d.j.morris@gmail.com', 'info@consultai.com.au']

// In-memory storage for Vercel deployment
// This will reset on each serverless function cold start
// For persistent storage, use a database
let inMemoryWhitelist: string[] | null = null

async function loadWhitelist(): Promise<string[]> {
  // If we have in-memory cache, return it
  if (inMemoryWhitelist !== null) {
    return inMemoryWhitelist
  }

  // Try to load from file system (works locally)
  if (process.env.NODE_ENV === 'development') {
    try {
      const whitelistPath = path.join(process.cwd(), 'whitelist.json')
      const data = await fs.readFile(whitelistPath, 'utf8')
      const whitelist = JSON.parse(data)
      inMemoryWhitelist = whitelist.approvedEmails || []
      return inMemoryWhitelist
    } catch (error) {
      console.log('Could not load whitelist from file:', error)
    }
  }

  // In production, load from environment variable
  const envWhitelist = process.env.APPROVED_EMAILS
  if (envWhitelist) {
    inMemoryWhitelist = envWhitelist.split(',').map(email => email.trim().toLowerCase())
    return inMemoryWhitelist
  }

  // Default whitelist
  inMemoryWhitelist = [
    'russ@skyeam.com.au',
    'russel.d.j.morris@gmail.com',
    'info@consultai.com.au'
  ]
  return inMemoryWhitelist
}

async function saveWhitelist(emails: string[]): Promise<void> {
  // Update in-memory cache
  inMemoryWhitelist = emails

  // In development, also save to file
  if (process.env.NODE_ENV === 'development') {
    try {
      const whitelistPath = path.join(process.cwd(), 'whitelist.json')
      const data = {
        approvedEmails: emails,
        lastUpdated: new Date().toISOString()
      }
      await fs.writeFile(whitelistPath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Could not save whitelist to file:', error)
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    console.log('GET session:', session?.user?.email)

    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      console.log('Unauthorized GET request from:', session?.user?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const whitelist = await loadWhitelist()
    return NextResponse.json({
      approvedEmails: whitelist,
      isProduction: process.env.NODE_ENV === 'production',
      note: process.env.NODE_ENV === 'production'
        ? 'In production, whitelist changes are temporary and will reset on server restart. Consider using a database for persistence.'
        : 'Whitelist is saved to whitelist.json file'
    })
  } catch (error) {
    console.error('Error in GET /api/admin/whitelist:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    console.log('POST session:', session?.user?.email)

    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      console.log('Unauthorized access attempt:', session?.user?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, email } = body
    console.log('Whitelist action:', action, 'Email:', email)

    if (!action || !email) {
      return NextResponse.json({ error: 'Missing action or email' }, { status: 400 })
    }

    // Load current whitelist
    let whitelist = await loadWhitelist()

    if (action === 'add') {
      const emailLower = email.toLowerCase().trim()
      if (!whitelist.includes(emailLower)) {
        whitelist.push(emailLower)
        await saveWhitelist(whitelist)
        return NextResponse.json({
          success: true,
          message: 'Email added successfully',
          isTemporary: process.env.NODE_ENV === 'production'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'Email already exists'
        })
      }
    } else if (action === 'remove') {
      const emailLower = email.toLowerCase().trim()
      const index = whitelist.indexOf(emailLower)
      if (index > -1) {
        whitelist.splice(index, 1)
        await saveWhitelist(whitelist)
        return NextResponse.json({
          success: true,
          message: 'Email removed successfully',
          isTemporary: process.env.NODE_ENV === 'production'
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'Email not found'
        })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in POST /api/admin/whitelist:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}