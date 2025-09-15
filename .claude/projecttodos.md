# Project Plan: Microsoft Entra External ID Frontend Authorization System

## Project Overview
Implement a fast-track Microsoft Entra External ID authentication system that leverages Microsoft's next-generation prepackaged identity services to create a secure, invitation-based authorization gate for the existing freight analytics dashboard.

## Core Objective
**"Enterprise-grade authentication with minimal custom development using Microsoft Entra External ID's prepackaged solutions"**

## Phase 1: Microsoft Entra External ID Setup (Prepackaged Solutions - 90 minutes)
**Objective**: Get Microsoft's prepackaged authentication running immediately

### PART A: User Instructions for Azure Setup (30 minutes)

#### Step 1: Create Azure AD B2C Tenant
**Action**: Set up your Microsoft identity service
**User Instructions**:
1. **Go to**: https://portal.azure.com
2. **Sign in** with your Microsoft account (personal or business)
3. **Search for**: "Azure AD B2C" in the top search bar
4. **Click**: "Create a resource" → "Azure AD B2C"
5. **Choose**: "Create a new Azure AD B2C Tenant"
6. **Fill out**:
   - **Tenant Name**: `freight-auth` (or your company name)
   - **Initial Domain**: `freightauth.onmicrosoft.com` (must be unique)
   - **Country/Region**: United States
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new → `freight-auth-rg`
7. **Click**: "Review + Create" → "Create"
8. **Wait**: 3-5 minutes for tenant creation
9. **Click**: "Go to resource" when deployment completes

**Deliverable**: Active Azure AD B2C tenant
**Evidence**: Dashboard shows "freight-auth" tenant

#### Step 2: Create User Flow for Sign-up/Sign-in
**Action**: Configure the prepackaged authentication screens
**User Instructions**:
1. **In Azure AD B2C dashboard**, click "User flows"
2. **Click**: "New user flow"
3. **Select**: "Sign up and sign in"
4. **Version**: "Recommended"
5. **Click**: "Create"
6. **Configure**:
   - **Name**: `signup_signin_flow`
   - **Identity providers**: Check "Email signup"
   - **Multifactor authentication**: "Off" (for now)
   - **User attributes**: Select:
     - ✅ Email Address (collect + return)
     - ✅ Display Name (collect + return)
     - ✅ Given Name (collect + return)
     - ✅ Surname (collect + return)
7. **Click**: "Create"

**Deliverable**: Working user flow
**Evidence**: User flow appears in list with "signup_signin_flow" name

#### Step 3: Create Application Registration
**Action**: Register your Next.js app with Azure
**User Instructions**:
1. **Click**: "App registrations" in left menu
2. **Click**: "New registration"
3. **Fill out**:
   - **Name**: `Freight Analytics App`
   - **Supported account types**: "Accounts in this organizational directory only"
   - **Redirect URI**: 
     - Platform: "Web"
     - URL: `https://frontend-auth-system-clean-git-master-russel-morris-projects.vercel.app/api/auth/callback/azure-ad-b2c`
   - Also add for local development: `http://localhost:3000/api/auth/callback/azure-ad-b2c`
4. **Click**: "Register"
5. **Copy** the following values (you'll need them):
   - **Application (client) ID**: (save this as `AZURE_AD_B2C_CLIENT_ID`)
   - **Directory (tenant) ID**: (save this as `AZURE_AD_B2C_TENANT_ID`)
6. **Click**: "Certificates & secrets"
7. **Click**: "New client secret"
8. **Description**: `FreightApp-Secret`
9. **Expires**: 24 months
10. **Click**: "Add"
11. **Copy**: The secret value (save this as `AZURE_AD_B2C_CLIENT_SECRET`)

**⚠️ CRITICAL**: Copy the client secret immediately - you cannot see it again!

**Deliverable**: App registration with credentials
**Evidence**: App appears in registrations list with client ID

#### Step 4: Configure Invitation Settings (Optional but Recommended)
**Action**: Set up invitation-only access
**User Instructions**:
1. **Click**: "User flows" → your `signup_signin_flow`
2. **Click**: "Properties"
3. **User assignment**: Change to "Assignment required"
4. **Self-service sign-up**: "Disabled" (only invited users can register)
5. **Click**: "Save"

**Deliverable**: Invitation-only configuration
**Evidence**: Properties show "Assignment required" and sign-up disabled

### PART B: Environment Configuration (15 minutes)

#### Step 5: Update Vercel Environment Variables
**Action**: Configure your deployment with Azure credentials
**User Instructions**:
1. **Go to**: https://vercel.com/dashboard
2. **Select**: your frontend project
3. **Go to**: Settings → Environment Variables
4. **Add** these variables:
   ```
   AZURE_AD_B2C_TENANT_NAME=freight-auth
   AZURE_AD_B2C_TENANT_ID=[from Step 3]
   AZURE_AD_B2C_CLIENT_ID=[from Step 3]
   AZURE_AD_B2C_CLIENT_SECRET=[from Step 3]
   AZURE_AD_B2C_PRIMARY_USER_FLOW=signup_signin_flow
   NEXTAUTH_URL=https://your-vercel-app.vercel.app
   NEXTAUTH_SECRET=ultra-secure-random-string-256-bits
   ```
5. **Environment**: Select "Production, Preview, and Development"
6. **Click**: "Save" for each variable

**Deliverable**: Environment variables configured
**Evidence**: All 7 variables show in Vercel dashboard

#### Step 6: Install Dependencies
**Action**: Add Azure AD B2C and NextAuth packages
**Files to modify**: `package.json`

```bash
npm install next-auth @azure/msal-node @azure/msal-browser
```

**Deliverable**: Dependencies installed
**Evidence**: Packages appear in package.json

### PART C: NextAuth Integration (45 minutes)

#### Step 7: Configure NextAuth with Azure AD B2C
**Action**: Create authentication configuration
**File**: `lib/auth.ts`

```typescript
import { NextAuthOptions } from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_B2C_TENANT_ID!,
      primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW!,
      authorization: {
        params: {
          scope: "openid profile email offline_access"
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // All Azure AD B2C authenticated users are allowed
      // (invitation filtering happens at the Azure level)
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
```

**Deliverable**: NextAuth configuration
**Evidence**: File compiles without errors

#### Step 8: Create NextAuth API Route
**Action**: Set up authentication endpoints
**File**: `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

**Deliverable**: API endpoints active
**Evidence**: Route accessible at `/api/auth/signin`

#### Step 9: Create Simple Sign-in Page
**Action**: Build authentication entry point
**File**: `app/auth/signin/page.tsx`

```typescript
'use client'

import { signIn, getSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard')
      }
    })
  }, [router])

  const handleSignIn = async () => {
    setLoading(true)
    await signIn('azure-ad', { 
      callbackUrl: '/dashboard' 
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Freight Analytics
          </h2>
          <p className="text-gray-600">
            Sign in with your Microsoft account to continue
          </p>
        </div>
        
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Continue with Microsoft'}
        </button>
        
        <p className="text-xs text-center text-gray-500">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}
```

**Deliverable**: Functional sign-in page
**Evidence**: Page loads at `/auth/signin`

#### Step 10: Add Session Provider to Layout
**Action**: Wrap app with authentication context
**File**: `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { authOptions } from "@/lib/auth";
import "./globals.css";

// ... font definitions ...

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

#### Step 11: Create Basic Route Protection
**Action**: Protect dashboard routes
**File**: `middleware.ts`

```typescript
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Request is already authenticated by this point
    return
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"]
}
```

**Deliverable**: Protected routes
**Evidence**: Unauthenticated access redirects to sign-in

---

## Phase 2: Custom Enhancement Features (4-6 hours)
**Objective**: Add custom functionality beyond what Azure provides

### Custom Admin Dashboard for User Management

#### Step 12: Create User Management API
**Action**: Build custom invitation and user management
**File**: `app/api/admin/users/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Get all users from your application database
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email?.endsWith('@yourdomain.com')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // Your logic to fetch users
  return NextResponse.json({ users: [] })
}

// Create invitation
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email?.endsWith('@yourdomain.com')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const { email } = await req.json()
  
  // Your logic to create Azure AD B2C invitation
  return NextResponse.json({ success: true })
}
```

#### Step 13: CSV Bulk Invitation System
**Action**: Build CSV upload interface
**File**: `app/admin/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  if (status === 'loading') return <div>Loading...</div>
  if (!session) redirect('/auth/signin')
  
  // Check if user is admin (customize this logic)
  const isAdmin = session.user?.email?.endsWith('@yourdomain.com')
  if (!isAdmin) redirect('/dashboard')

  const handleCsvUpload = async () => {
    if (!csvFile) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append('csv', csvFile)
    
    try {
      const response = await fetch('/api/admin/bulk-invite', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        alert('Invitations sent successfully!')
        setCsvFile(null)
      } else {
        alert('Failed to send invitations')
      }
    } catch (error) {
      alert('Error uploading file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Bulk User Invitation</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV file with email addresses
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <button
            onClick={handleCsvUpload}
            disabled={!csvFile || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Sending Invitations...' : 'Send Invitations'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### Step 14: CSV Processing API
**Action**: Handle bulk invitation processing
**File**: `app/api/admin/bulk-invite/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email?.endsWith('@yourdomain.com')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const formData = await req.formData()
  const csvFile = formData.get('csv') as File
  
  if (!csvFile) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  
  const csvText = await csvFile.text()
  const emails = csvText.split('\n')
    .map(line => line.trim())
    .filter(email => email && email.includes('@'))
  
  // Process each email for invitation
  const results = []
  for (const email of emails) {
    try {
      // Here you would integrate with Azure AD B2C Graph API
      // to send invitations programmatically
      
      // Placeholder for now
      console.log(`Sending invitation to: ${email}`)
      results.push({ email, status: 'sent' })
    } catch (error) {
      results.push({ email, status: 'failed', error: error.message })
    }
  }
  
  return NextResponse.json({ results })
}
```

#### Step 15: Domain Filtering Enhancement
**Action**: Add application-level domain filtering
**File**: `lib/auth.ts` (update the signIn callback)

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    const allowedDomains = [
      'yourcompany.com',
      'partnercorp.com',
      'clientcompany.com'
    ]
    
    const domain = user.email?.split('@')[1]
    
    if (!allowedDomains.includes(domain)) {
      console.log(`[SECURITY] Blocked login from unauthorized domain: ${domain}`)
      return false
    }
    
    return true
  },
  // ... rest of callbacks
}
```

---

## Testing and Deployment Strategy

### Phase 1 Testing (Azure Prepackaged - 30 minutes)
1. **Test Azure Sign-in Flow**: Visit `/auth/signin` → Microsoft login → Dashboard access
2. **Test Route Protection**: Direct dashboard access → Redirect to sign-in
3. **Test Session Persistence**: Reload page → Stay logged in
4. **Test Sign-out**: Sign out → Redirect to sign-in page

### Phase 2 Testing (Custom Features - 1 hour)
1. **Test Admin Access**: Admin user → Access admin panel
2. **Test CSV Upload**: Upload test CSV → Verify invitations processed
3. **Test Domain Filtering**: Try login with blocked domain → Access denied
4. **Test Bulk Operations**: Large CSV file → Performance validation

---

## Azure AD B2C Benefits Summary

### What You Get for Free (Prepackaged):
✅ **Professional login screens** with Microsoft branding
✅ **Multi-factor authentication** (when enabled)
✅ **Password reset flows** with email integration
✅ **Account recovery** and security features
✅ **Invitation system** through Azure portal
✅ **Unlimited external users** (no Google OAuth limits)
✅ **Enterprise security** and compliance
✅ **Mobile-optimized** login flows
✅ **Custom branding** options (logos, colors)
✅ **Social login providers** (Google, Facebook, etc. can be added)

### What We Build Custom:
🛠️ **CSV bulk invitation interface** (2-3 hours)
🛠️ **Admin user management dashboard** (2-3 hours)
🛠️ **Domain filtering logic** (30 minutes)
🛠️ **Integration with existing freight dashboard** (1 hour)

---

## Timeline Estimate

**Phase 1 (Azure Setup + Basic Integration)**: 90 minutes
- Azure tenant setup: 30 minutes
- Environment configuration: 15 minutes  
- NextAuth integration: 45 minutes

**Phase 2 (Custom Features)**: 4-6 hours
- Admin dashboard: 2-3 hours
- CSV bulk invitation: 1-2 hours
- Domain filtering: 30 minutes
- Testing and refinement: 1 hour

**Total Time**: 5.5-7.5 hours vs 10-15 days for custom OAuth solution

---

## Security Benefits Over Custom Solution

✅ **Microsoft-grade security** (battle-tested by millions of enterprise users)
✅ **Automatic security updates** (Microsoft handles patches)
✅ **Compliance certifications** (SOC 2, ISO 27001, GDPR ready)
✅ **Threat detection** and anomaly monitoring
✅ **Zero security code to maintain** (Microsoft handles it)
✅ **Professional audit trail** built-in

This approach gives you enterprise-grade authentication in hours instead of weeks, with 90% of functionality coming from Microsoft's prepackaged solutions.