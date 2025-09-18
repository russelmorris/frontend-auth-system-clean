import { NextAuthOptions } from "next-auth"

// Azure AD B2C Configuration - Recommended approach for external users
export const authOptionsB2C: NextAuthOptions = {
  debug: true,
  providers: [
    {
      id: "azure-ad-b2c",
      name: "Microsoft",
      type: "oauth",
      clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
      authorization: {
        url: `https://${process.env.AZURE_AD_B2C_TENANT_NAME}.b2clogin.com/${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/${process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW}/oauth2/v2.0/authorize`,
        params: {
          scope: "openid profile email",
          prompt: "select_account",
          response_type: "code"
        }
      },
      token: `https://${process.env.AZURE_AD_B2C_TENANT_NAME}.b2clogin.com/${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/${process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW}/oauth2/v2.0/token`,
      userinfo: `https://${process.env.AZURE_AD_B2C_TENANT_NAME}.b2clogin.com/${process.env.AZURE_AD_B2C_TENANT_NAME}.onmicrosoft.com/${process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW}/openid/v2.0/userinfo`,
      profile(profile) {
        return {
          id: profile.sub || profile.oid,
          name: profile.name || profile.given_name + " " + profile.family_name,
          email: profile.email || profile.emails?.[0],
          image: null
        }
      }
    }
  ],
  trustHost: true,
  useSecureCookies: false,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Azure AD B2C Sign in attempt:", {
        user: user?.email,
        account: account?.provider,
        profile: profile?.email
      })
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

// Regular Azure AD Configuration (current problematic one)
export const authOptionsAzureAD: NextAuthOptions = {
  debug: true,
  providers: [
    {
      id: "azure-ad",
      name: "Microsoft",
      type: "oauth",
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      authorization: {
        url: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
        params: {
          scope: "openid profile email",
          prompt: "select_account",
          response_type: "code"
        }
      },
      token: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
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
  trustHost: true,
  useSecureCookies: false,
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Azure AD Sign in attempt:", {
        user: user?.email,
        account: account?.provider,
        profile: profile?.email
      })
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