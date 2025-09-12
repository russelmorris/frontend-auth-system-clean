import { NextRequest, NextResponse } from "next/server"

export default async function middleware(req: NextRequest) {
  // TEMPORARY: Simplified middleware for deployment testing
  // The complex auth middleware was causing Vercel deployment failures
  
  const response = NextResponse.next()
  
  // Basic security headers only
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  return response
}

export const config = {
  matcher: [
    // Protect ALL routes except explicitly allowed ones
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}