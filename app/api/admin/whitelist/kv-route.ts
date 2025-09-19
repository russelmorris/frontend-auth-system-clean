import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { kv } from '@vercel/kv'

// Admin emails who can manage the whitelist
const ADMIN_EMAILS = ['russ@skyeam.com.au', 'russel.d.j.morris@gmail.com', 'info@consultai.com.au']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get whitelist from Vercel KV
    const whitelist = await kv.get<string[]>('whitelist') || []

    return NextResponse.json({ approvedEmails: whitelist })
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
    let whitelist = await kv.get<string[]>('whitelist') || []

    if (action === 'add') {
      if (!whitelist.includes(email)) {
        whitelist.push(email)
        await kv.set('whitelist', whitelist)
      }
    } else if (action === 'remove') {
      whitelist = whitelist.filter(e => e !== email)
      await kv.set('whitelist', whitelist)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating whitelist:', error)
    return NextResponse.json({ error: 'Failed to update whitelist' }, { status: 500 })
  }
}