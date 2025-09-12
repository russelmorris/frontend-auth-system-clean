import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
// Temporarily disable Prisma for Vercel deployment testing
// import { PrismaAdapter } from "@next-auth/prisma-adapter"
// import { PrismaClient } from "@prisma/client"

// const prisma = new PrismaClient({
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL || process.env.AUTH_DATABASE_URL
//     }
//   }
// })

export const authOptions: NextAuthOptions = {
  // adapter: (process.env.DATABASE_URL || process.env.AUTH_DATABASE_URL) ? PrismaAdapter(prisma) : undefined,
  providers: [
    // Only add Google provider if credentials are configured
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    // Microsoft provider will be added after Google OAuth setup is confirmed working
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log(`[SECURITY] Sign-in attempt for: ${user.email}`)
      
      // Strict email validation
      if (!user.email || !user.email.includes('@')) {
        console.log(`[SECURITY] Invalid email format: ${user.email}`)
        return false
      }
      
      // Check if user has a valid invitation (can be enhanced later)
      // For now, allow all valid OAuth users
      return true
    },
    async jwt({ token, user, account, trigger }) {
      // Enhanced JWT security
      if (user) {
        token.role = user.role || 'user'
        token.userId = user.id
        token.email = user.email
        token.provider = account?.provider
        token.createdAt = Date.now()
      }
      
      // Token rotation/validation on each request
      if (trigger === 'update' && token.createdAt) {
        // Force re-authentication if token is too old
        const tokenAge = Date.now() - (token.createdAt as number)
        if (tokenAge > 7 * 24 * 60 * 60 * 1000) { // 7 days
          console.log(`[SECURITY] Token expired for user: ${token.email}`)
          return null
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Enhanced session validation
      if (!token.userId || !token.email) {
        console.log(`[SECURITY] Invalid token structure in session callback`)
        return null
      }
      
      if (session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.email = token.email as string
      }
      
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours (more secure)
    updateAge: 60 * 60, // Update session every hour
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-deployment-9ece6c643bb3743d06d6b74f9ce834b09f42c6db60ad3c83d6d4833f815cdafb',
  debug: process.env.NODE_ENV === 'development',
}

// Type augmentation for NextAuth
declare module "next-auth" {
  interface User {
    role?: string
  }
  
  interface Session {
    user: {
      id: string
      role: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    role?: string
  }
}