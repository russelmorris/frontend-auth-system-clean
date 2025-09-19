import NextAuth from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { NextAuthOptions } from "next-auth"
import fs from 'fs'
import path from 'path'

// Load whitelist
function loadWhitelist(): string[] {
  // First try environment variable (preferred for production/Vercel)
  const envWhitelist = process.env.APPROVED_EMAILS
  if (envWhitelist) {
    console.log('Loading whitelist from environment variable')
    return envWhitelist.split(',').map(email => email.trim().toLowerCase())
  }

  // Fallback to JSON file for local development
  try {
    const whitelistPath = path.join(process.cwd(), 'auth-module', 'whitelist.json')
    const whitelistData = fs.readFileSync(whitelistPath, 'utf8')
    const whitelist = JSON.parse(whitelistData)
    console.log('Loading whitelist from JSON file')
    return whitelist.approvedEmails.map((email: string) => email.toLowerCase())
  } catch (error) {
    console.error('No whitelist configuration found')
    return []
  }
}

const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    // Single provider that supports both work and personal accounts
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // Don't specify tenantId to use common endpoint
      authorization: {
        params: {
          scope: "openid profile email offline_access User.Read",
          prompt: "select_account",
        }
      },
      // Handle issuer validation for multi-tenant
      issuer: undefined,
      // Override profile to handle both account types
      profile(profile) {
        return {
          id: profile.sub || profile.oid,
          name: profile.name,
          email: profile.email || profile.preferred_username,
          image: profile.picture
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Load approved emails
      const approvedEmails = loadWhitelist()

      // Check if user's email is in the whitelist
      const userEmail = user?.email?.toLowerCase()

      if (!userEmail) {
        console.log("Sign in blocked: No email found")
        return false
      }

      if (approvedEmails.length === 0) {
        // If no whitelist is configured, allow all (for initial setup)
        console.log("Warning: No whitelist configured, allowing all users")
        return true
      }

      const isApproved = approvedEmails.includes(userEmail)

      if (isApproved) {
        console.log("Sign in approved for:", userEmail)
      } else {
        console.log("Sign in blocked - email not whitelisted:", userEmail)
      }

      return isApproved
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
        token.refreshToken = account.refresh_token
      }
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.userId as string,
        email: token.email as string,
        name: token.name as string,
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after successful sign in
      if (url.startsWith(baseUrl)) {
        return '/dashboard'
      }
      return baseUrl + '/dashboard'
    }
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 // 24 hours
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }