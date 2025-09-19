import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import fs from 'fs/promises'
import path from 'path'

// Admin emails who can manage the whitelist
const ADMIN_EMAILS = ['russ@skyeam.com.au', 'info@consultai.com.au'] // Add your admin emails here

export async function GET(req: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession()
    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read whitelist from root directory
    const whitelistPath = path.join(process.cwd(), 'whitelist.json')
    const data = await fs.readFile(whitelistPath, 'utf8')
    const whitelist = JSON.parse(data)

    return NextResponse.json(whitelist)
  } catch (error) {
    console.error('Error reading whitelist:', error)
    return NextResponse.json({ approvedEmails: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession()
    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, email } = body

    const whitelistPath = path.join(process.cwd(), 'whitelist.json')

    // Read current whitelist
    let whitelist = { approvedEmails: [] as string[] }
    try {
      const data = await fs.readFile(whitelistPath, 'utf8')
      whitelist = JSON.parse(data)
    } catch (error) {
      // File doesn't exist, create new one
    }

    if (action === 'add') {
      // Add email if not already present
      if (!whitelist.approvedEmails.includes(email)) {
        whitelist.approvedEmails.push(email)
      }
    } else if (action === 'remove') {
      // Remove email
      whitelist.approvedEmails = whitelist.approvedEmails.filter(e => e !== email)
    }

    // Save updated whitelist
    await fs.writeFile(
      whitelistPath,
      JSON.stringify(whitelist, null, 2)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating whitelist:', error)
    return NextResponse.json({ error: 'Failed to update whitelist' }, { status: 500 })
  }
}