import { NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: "organizations", // Only organizational accounts, no personal
      authorization: {
        params: {
          scope: "openid profile email",
          prompt: "select_account" // Forces account selection screen
        }
      },
      checks: ["state"] // Explicitly enable state parameter checking
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false // Set to false for localhost
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Debug logging
      console.log("Sign in attempt:", { user: user?.email, account: account?.provider, profile: profile?.email })
      // All Azure AD authenticated users are allowed
      // (domain filtering can be added here if needed)
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as string
      session.user.email = token.email as string
      session.user.name = token.name as string
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
}