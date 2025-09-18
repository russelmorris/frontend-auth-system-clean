'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-2">
            Access Denied
          </h2>

          {error === 'AccessDenied' ? (
            <>
              <p className="text-gray-600 mb-4">
                Your email address is not authorized to access this application.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  This application uses an email whitelist for security.
                  If you believe you should have access, please contact your administrator.
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-600 mb-4">
              An authentication error occurred. Please try again.
            </p>
          )}

          <Link
            href="/auth/signin"
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}