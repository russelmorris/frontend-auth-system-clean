import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { WhitelistStorage } from '@/lib/whitelist-storage'

// Admin emails who can manage the whitelist
const ADMIN_EMAILS = ['russ@skyeam.com.au', 'russel.d.j.morris@gmail.com', 'info@consultai.com.au']

export async function GET(req: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)

    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      console.log('Unauthorized GET request from:', session?.user?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const whitelist = await WhitelistStorage.getWhitelist()

    return NextResponse.json({
      approvedEmails: whitelist,
      storageType: WhitelistStorage.isUsingKV() ? 'Vercel KV (Persistent)' : 'Local File',
      note: WhitelistStorage.isUsingKV()
        ? 'Data is stored persistently in Vercel KV'
        : 'Data is stored locally in whitelist.json'
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

    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      console.log('Unauthorized POST request from:', session?.user?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action, email } = body

    if (!action || !email) {
      return NextResponse.json({ error: 'Missing action or email' }, { status: 400 })
    }

    let success = false
    let message = ''

    if (action === 'add') {
      success = await WhitelistStorage.addEmail(email, session.user.email)
      message = success ? 'Email added successfully' : 'Email already exists'
    } else if (action === 'remove') {
      success = await WhitelistStorage.removeEmail(email)
      message = success ? 'Email removed successfully' : 'Email not found'
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({
      success,
      message,
      storageType: WhitelistStorage.isUsingKV() ? 'Vercel KV' : 'Local File'
    })
  } catch (error) {
    console.error('Error in POST /api/admin/whitelist:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}