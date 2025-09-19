import { NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { WhitelistStorage } from './whitelist-storage'

// Load whitelist using the unified storage system
async function loadWhitelist(): Promise<string[]> {
  try {
    const whitelist = await WhitelistStorage.getWhitelist()
    console.log(`Loading whitelist from ${WhitelistStorage.isUsingKV() ? 'Vercel KV' : 'local file'}:`, whitelist.length, 'emails')
    return whitelist.map((email: string) => email.toLowerCase())
  } catch (error) {
    console.error('Error loading whitelist:', error)
    // Fallback to environment variable
    const envWhitelist = process.env.APPROVED_EMAILS
    if (envWhitelist) {
      console.log('Loading whitelist from environment variable')
      return envWhitelist.split(',').map(email => email.trim().toLowerCase())
    }
    return []
  }
}

export const authOptions: NextAuthOptions = {
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
      const approvedEmails = await loadWhitelist()

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
      // Preserve the intended destination
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Only default to dashboard for external URLs
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