import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  debug: true, // Enable debugging
  providers: [
    {
      id: "azure-ad",
      name: "Microsoft",
      type: "oauth",
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      authorization: {
        url: "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
        params: {
          scope: "openid profile email",
          prompt: "select_account",
          response_type: "code"
        }
      },
      token: "https://login.microsoftonline.com/organizations/oauth2/v2.0/token",
      userinfo: "https://graph.microsoft.com/v1.0/me",
      profile(profile) {
        return {
          id: profile.id,
          name: profile.displayName || profile.name,
          email: profile.mail || profile.userPrincipalName,
          image: null
        }
      }
    }
  ],
  // Use both localhost and IP address redirect URIs
  trustHost: true,
  useSecureCookies: false,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  // Remove custom cookie configuration to use NextAuth defaults
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