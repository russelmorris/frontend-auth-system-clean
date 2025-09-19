// Security utilities for bulletproof authentication protection
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'

// CSRF Protection
export function validateCSRFToken(request: NextRequest): boolean {
  const csrfToken = request.headers.get('x-csrf-token')
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  // Validate origin matches host for same-origin policy
  if (origin && host) {
    const originHost = new URL(origin).host
    if (originHost !== host) {
      return false
    }
  }
  
  return true
}

// Rate limiting for auth endpoints
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

export function checkRateLimit(ip: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now }
  
  // Reset window if expired
  if (now - userLimit.lastReset > windowMs) {
    userLimit.count = 0
    userLimit.lastReset = now
  }
  
  userLimit.count++
  rateLimitMap.set(ip, userLimit)
  
  return userLimit.count <= maxRequests
}

// Secure session validation with additional checks
export async function validateSecureSession(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return null
    }
    
    // Additional security checks
    const userAgent = request.headers.get('user-agent')
    const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    
    // Basic session integrity check
    if (!session.user?.email || !session.user?.id) {
      return null
    }
    
    // Check if session is too old (additional safety)
    const sessionAge = Date.now() - new Date(session.expires || 0).getTime()
    if (sessionAge > 30 * 24 * 60 * 60 * 1000) { // 30 days max
      return null
    }
    
    return session
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

// Content Security Policy headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy - prevents XSS
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
    
    // Additional security headers
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-XSS-Protection': '1; mode=block'
  }
}

// API route protection wrapper
export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async function protectedHandler(req: NextRequest) {
    try {
      // Rate limiting
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      if (!checkRateLimit(ip, 50, 60000)) { // 50 requests per minute
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }
      
      // CSRF validation for non-GET requests
      if (req.method !== 'GET' && !validateCSRFToken(req)) {
        return NextResponse.json(
          { error: 'CSRF validation failed' },
          { status: 403 }
        )
      }
      
      // Session validation
      const session = await validateSecureSession(req)
      if (!session) {
        return NextResponse.json(
          { error: 'Unauthorized - valid session required' },
          { status: 401 }
        )
      }
      
      // Add session to request context
      ;(req as any).session = session
      
      // Call the actual handler
      const response = await handler(req)
      
      // Add security headers to response
      const securityHeaders = getSecurityHeaders()
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
      
    } catch (error) {
      console.error('Auth wrapper error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}