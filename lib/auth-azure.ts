import { NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // CRITICAL: For personal accounts, DO NOT specify tenantId
      // This makes it use 'common' endpoint properly
      // tenantId: process.env.AZURE_AD_TENANT_ID,

      authorization: {
        params: {
          prompt: "select_account",
          // Include offline_access for refresh tokens
          scope: "openid profile email offline_access User.Read"
        }
      },

      // IMPORTANT: Override the issuer check for multi-tenant
      issuer: process.env.AZURE_AD_TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`
        : undefined,

      // Allow both work and personal accounts
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },

      // Custom profile mapping to handle both account types
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email || profile.preferred_username,
          image: profile.picture
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Sign in attempt:", {
        user: user?.email,
        provider: account?.provider,
        issuer: account?.issuer
      })
      return true
    },

    async jwt({ token, user, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string
      return session
    }
  },

  // Use JWT strategy for better compatibility
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 // 24 hours
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
}