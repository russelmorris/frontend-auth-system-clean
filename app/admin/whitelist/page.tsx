'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface WhitelistData {
  approvedEmails: string[]
}

export default function WhitelistManager() {
  const { data: session, status } = useSession()
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  // Only allow specific admin emails to manage the whitelist
  const adminEmails = ['russ@skyeam.com.au', 'info@consultai.com.au']

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      window.location.href = '/auth/signin'
      return
    }

    if (!adminEmails.includes(session.user?.email?.toLowerCase() || '')) {
      window.location.href = '/dashboard'
      return
    }

    fetchWhitelist()
  }, [session, status])

  const fetchWhitelist = async () => {
    try {
      const response = await fetch('/api/admin/whitelist')
      if (response.ok) {
        const data = await response.json()
        setWhitelist(data.approvedEmails || [])
      }
    } catch (error) {
      console.error('Error fetching whitelist:', error)
    } finally {
      setLoading(false)
    }
  }

  const addEmail = async () => {
    if (!newEmail.trim()) return

    try {
      const response = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          email: newEmail.toLowerCase().trim()
        })
      })

      if (response.ok) {
        setWhitelist([...whitelist, newEmail.toLowerCase().trim()])
        setNewEmail('')
        setMessage('Email added successfully')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error adding email:', error)
      setMessage('Error adding email')
    }
  }

  const removeEmail = async (email: string) => {
    try {
      const response = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          email: email
        })
      })

      if (response.ok) {
        setWhitelist(whitelist.filter(e => e !== email))
        setMessage('Email removed successfully')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error removing email:', error)
      setMessage('Error removing email')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Redirecting to login...</div>
      </div>
    )
  }

  if (!adminEmails.includes(session.user?.email?.toLowerCase() || '')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Whitelist Management</h1>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Email to Whitelist</h2>
          <div className="flex gap-4">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Email
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Approved Emails ({whitelist.length})</h2>
          <div className="space-y-2">
            {whitelist.length === 0 ? (
              <p className="text-gray-500">No emails in whitelist</p>
            ) : (
              whitelist.map((email) => (
                <div key={email} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>Note: Changes to the whitelist take effect immediately.</p>
          <p>Users not in the whitelist will be denied access even if they have valid Microsoft accounts.</p>
        </div>
      </div>
    </div>
  )
}