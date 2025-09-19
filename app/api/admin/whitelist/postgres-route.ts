import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { sql } from '@vercel/postgres'

// Admin emails who can manage the whitelist
const ADMIN_EMAILS = ['russ@skyeam.com.au', 'russel.d.j.morris@gmail.com', 'info@consultai.com.au']

// Create table if it doesn't exist
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS whitelist (
      email VARCHAR(255) PRIMARY KEY,
      added_by VARCHAR(255),
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !ADMIN_EMAILS.includes(session.user?.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureTable()

    const { rows } = await sql`SELECT email FROM whitelist ORDER BY email`
    const whitelist = rows.map(row => row.email)

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
    await ensureTable()

    if (action === 'add') {
      await sql`
        INSERT INTO whitelist (email, added_by)
        VALUES (${email}, ${session.user.email})
        ON CONFLICT (email) DO NOTHING
      `
    } else if (action === 'remove') {
      await sql`DELETE FROM whitelist WHERE email = ${email}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating whitelist:', error)
    return NextResponse.json({ error: 'Failed to update whitelist' }, { status: 500 })
  }
}