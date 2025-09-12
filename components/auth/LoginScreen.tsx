"use client"

import { signIn, getSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AuthLayout } from "./AuthLayout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Chrome } from "lucide-react"
import { Suspense } from "react"

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams.get('error')

  useEffect(() => {
    // Check if user is already authenticated
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl)
      }
    })

    // Handle OAuth errors
    if (errorParam) {
      switch (errorParam) {
        case 'OAuthSignin':
          setError('Error constructing an authorization URL')
          break
        case 'OAuthCallback':
          setError('Error handling the OAuth callback')
          break
        case 'OAuthCreateAccount':
          setError('Error creating OAuth account')
          break
        case 'EmailCreateAccount':
          setError('Error creating email account')
          break
        case 'Callback':
          setError('Error in the OAuth callback handler')
          break
        case 'OAuthAccountNotLinked':
          setError('Email already exists with a different provider')
          break
        case 'EmailSignin':
          setError('Error sending verification email')
          break
        case 'CredentialsSignin':
          setError('Invalid credentials')
          break
        case 'SessionRequired':
          setError('Please sign in to access this page')
          break
        default:
          setError('An error occurred during authentication')
      }
    }
  }, [callbackUrl, errorParam, router])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await signIn('google', {
        callbackUrl,
        redirect: false
      })

      if (result?.error) {
        setError('Failed to sign in with Google')
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMicrosoftSignIn = async () => {
    // This will be implemented after Google is working
    setError('Microsoft sign-in coming soon')
  }

  return (
    <AuthLayout 
      title="Welcome" 
      subtitle="Sign in to access your freight analytics dashboard"
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
          size="lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        <Button
          onClick={handleMicrosoftSignIn}
          disabled={true}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
          </svg>
          Microsoft (Coming Soon)
        </Button>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
          <p>By signing in, you agree to our terms of service and privacy policy.</p>
        </div>
      </div>
    </AuthLayout>
  )
}

export function LoginScreen() {
  return (
    <Suspense fallback={
      <AuthLayout 
        title="Welcome" 
        subtitle="Loading authentication options..."
      >
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AuthLayout>
    }>
      <LoginContent />
    </Suspense>
  )
}