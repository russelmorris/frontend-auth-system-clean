'use client'

import { signIn, getSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('azure-ad', { 
      callbackUrl: '/dashboard' 
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Freight Analytics
          </h2>
          <p className="text-gray-600">
            Sign in with your Microsoft account to continue
          </p>
        </div>
        
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Continue with Microsoft'}
        </button>
        
        <p className="text-xs text-center text-gray-500">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}