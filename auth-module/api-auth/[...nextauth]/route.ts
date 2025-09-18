import NextAuth from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { NextAuthOptions } from "next-auth"

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
      console.log("Sign in successful:", {
        email: user?.email,
        provider: account?.provider,
        issuer: account?.issuer
      })
      return true
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