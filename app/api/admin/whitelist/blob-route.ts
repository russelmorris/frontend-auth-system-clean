import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { put, get } from '@vercel/blob'

// Admin emails who can manage the whitelist
const ADMIN_EMAILS = ['russ@skyeam.com.au', 'russel.d.j.morris@gmail.com', 'info@consultai.com.au']

const WHITELIST_BLOB_KEY = 'whitelist.json'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get whitelist from Vercel Blob
    try {
      const blob = await get(WHITELIST_BLOB_KEY)
      const text = await blob.text()
      const data = JSON.parse(text)
      return NextResponse.json({ approvedEmails: data.approvedEmails || [] })
    } catch (error) {
      // If blob doesn't exist, return empty whitelist
      return NextResponse.json({ approvedEmails: [] })
    }
  } catch (error) {
    console.error('Error reading whitelist:', error)
    return NextResponse.json({ error: 'Failed to load whitelist' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, email } = await req.json()

    // Get current whitelist
    let whitelist = []
    try {
      const blob = await get(WHITELIST_BLOB_KEY)
      const text = await blob.text()
      const data = JSON.parse(text)
      whitelist = data.approvedEmails || []
    } catch (error) {
      // Start with empty whitelist if blob doesn't exist
      whitelist = []
    }

    if (action === 'add') {
      if (!whitelist.includes(email)) {
        whitelist.push(email)
      }
    } else if (action === 'remove') {
      whitelist = whitelist.filter(e => e !== email)
    }

    // Save updated whitelist
    const data = {
      approvedEmails: whitelist,
      lastUpdated: new Date().toISOString(),
      updatedBy: session.user.email
    }

    await put(WHITELIST_BLOB_KEY, JSON.stringify(data, null, 2), {
      contentType: 'application/json',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating whitelist:', error)
    return NextResponse.json({ error: 'Failed to update whitelist' }, { status: 500 })
  }
}