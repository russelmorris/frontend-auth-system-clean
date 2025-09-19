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
        url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`,
        params: {
          scope: "openid profile email User.Read",
          prompt: "select_account",
          response_type: "code",
          response_mode: "query"
        }
      },
      token: {
        url: `https://login.microsoftonline.com/common/oauth2/v2.0/token`,
        params: {
          scope: "openid profile email User.Read",
          grant_type: "authorization_code"
        }
      },
      userinfo: "https://graph.microsoft.com/v1.0/me",
      issuer: "https://login.microsoftonline.com/common/v2.0",
      profile(profile) {
        return {
          id: profile.id || profile.sub,
          name: profile.displayName || profile.name,
          email: profile.mail || profile.userPrincipalName || profile.email,
          image: null
        }
      }
    }
  ],
  // Use both localhost and IP address redirect URIs
  trustHost: true,
  useSecureCookies: false,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
        maxAge: 900 // 15 minutes
      }
    }
  },
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