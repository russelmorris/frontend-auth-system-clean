import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { getSecurityHeaders, checkRateLimit, validateCSRFToken } from "@/lib/security"

export default withAuth(
  function middleware(req) {
    const response = NextResponse.next()
    
    // Apply security headers to all responses
    const securityHeaders = getSecurityHeaders()
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Rate limiting for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      
      // More restrictive rate limiting for API routes
      if (!checkRateLimit(ip, 30, 60000)) { // 30 requests per minute for API
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }
      
      // CSRF protection for non-GET API requests
      if (req.method !== 'GET' && !validateCSRFToken(req)) {
        return NextResponse.json(
          { error: 'CSRF validation failed' },
          { status: 403 }
        )
      }
    }
    
    // Additional logging for security monitoring
    if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/api/')) {
      console.log(`[SECURITY] Protected route access: ${req.method} ${req.nextUrl.pathname} from ${req.ip || 'unknown'}`)
    }
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to auth pages without token
        if (pathname.startsWith('/auth')) {
          return true
        }
        
        // Allow access to NextAuth API routes
        if (pathname.startsWith('/api/auth')) {
          return true
        }
        
        // Allow access to invitation validation (public endpoint)
        if (pathname === '/api/invitations/validate' && req.method === 'POST') {
          return true
        }
        
        // Allow access to static files
        if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
          return true
        }
        
        // STRICT: All other routes require authentication
        // This includes:
        // - /dashboard and all sub-routes
        // - All /api routes except auth and invitation validation
        // - Any other dynamic routes
        
        if (!token) {
          console.log(`[SECURITY] Unauthorized access attempt to: ${pathname}`)
          return false
        }
        
        // Additional token validation
        if (!token.userId || !token.email) {
          console.log(`[SECURITY] Invalid token structure for: ${pathname}`)
          return false
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    // Protect ALL routes except explicitly allowed ones
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}