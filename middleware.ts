import { NextRequest, NextResponse } from "next/server"

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Allow access to auth pages and API routes without restriction
  if (pathname.startsWith('/auth') || 
      pathname.startsWith('/api/auth') || 
      pathname.startsWith('/_next/') || 
      pathname.startsWith('/favicon.ico') ||
      pathname === '/') {
    const response = NextResponse.next()
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    return response
  }
  
  // For all other routes, redirect to signin for now
  return NextResponse.redirect(new URL('/auth/signin', req.url))
}

export const config = {
  matcher: [
    // Protect ALL routes except explicitly allowed ones
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}