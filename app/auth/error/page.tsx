"use client"

import { useSearchParams } from "next/navigation"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Suspense } from "react"

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to access this application.'
      case 'Verification':
        return 'The verification link is invalid or has expired.'
      default:
        return 'An error occurred during authentication. Please try again.'
    }
  }

  return (
    <AuthLayout 
      title="Authentication Error" 
      subtitle="Something went wrong during sign in"
    >
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(error)}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/signin">
              Try Again
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              Go to Home
            </Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="Authentication Error" subtitle="Loading...">
        <div>Loading...</div>
      </AuthLayout>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}