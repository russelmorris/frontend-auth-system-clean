import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Apply security headers to all responses
  const response = NextResponse.next()
  const securityHeaders = {
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://login.microsoftonline.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https://lh3.googleusercontent.com https://graph.microsoft.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.vercel.com;
      frame-src https://accounts.google.com https://login.microsoftonline.com;
      object-src 'none';
      media-src 'self';
      worker-src 'none';
    `.replace(/\s+/g, ' ').trim(),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block'
  }
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    // Simple rate limiting check (basic implementation for Edge Runtime)
    const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    // CSRF protection for non-GET API requests
    if (req.method !== 'GET') {
      const origin = req.headers.get('origin')
      const host = req.headers.get('host')
      
      if (origin && host) {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return NextResponse.json(
            { error: 'CSRF validation failed' },
            { status: 403 }
          )
        }
      }
    }
  }
  
  // Allow access to auth pages without token
  if (pathname.startsWith('/auth')) {
    return response
  }
  
  // Allow access to NextAuth API routes
  if (pathname.startsWith('/api/auth')) {
    return response
  }
  
  // Allow access to invitation validation (public endpoint)
  if (pathname === '/api/invitations/validate' && req.method === 'POST') {
    return response
  }
  
  // Allow access to static files
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/public/')) {
    return response
  }
  
  // Allow root page access
  if (pathname === '/') {
    return response
  }
  
  // STRICT: All other routes require authentication
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      console.log(`[SECURITY] Unauthorized access attempt to: ${pathname}`)
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    // Additional token validation
    if (!token.userId || !token.email) {
      console.log(`[SECURITY] Invalid token structure for: ${pathname}`)
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    // Additional logging for security monitoring
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
      const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      console.log(`[SECURITY] Protected route access: ${req.method} ${pathname} from ${ip}`)
    }
    
    return response
  } catch (error) {
    console.log(`[SECURITY] Token validation error for: ${pathname}`, error)
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
}

export const config = {
  matcher: [
    // Protect ALL routes except explicitly allowed ones
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}