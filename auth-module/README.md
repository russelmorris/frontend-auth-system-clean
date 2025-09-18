# Microsoft Azure AD Authentication Module for Next.js

A plug-and-play authentication module using Microsoft Azure AD with NextAuth.js. Features email whitelist protection to control who can access your application.

## Quick Start

### 1. Copy this folder to your Next.js project

Copy the entire `auth-module` folder to your Next.js application root.

### 2. Install Dependencies

```bash
npm install next-auth
```

### 3. Environment Variables

Create or update your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000  # Update for production
NEXTAUTH_SECRET=your-nextauth-secret-here  # Generate with: openssl rand -base64 32

# Microsoft Azure AD Configuration
AZURE_AD_CLIENT_ID=65d76e79-bc39-4f21-89cd-cf9f6a49401b
AZURE_AD_CLIENT_SECRET=your-azure-client-secret-here  # Generate in Azure Portal
```

### 4. Add Authentication Files to Your App

Copy these files to your Next.js app directory:

- `app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `app/auth/signin/page.tsx` - Sign-in page
- `middleware.ts` - Route protection (optional)

### 5. Wrap Your App with SessionProvider

In your root `app/layout.tsx`:

```tsx
import { SessionProvider } from '@/auth-module/components/SessionProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

### 6. Azure Portal Setup

In Azure Portal, add these redirect URIs to your app registration:

**For Development:**
- `http://localhost:3000/api/auth/callback/azure-ad`

**For Production (Vercel):**
- `https://your-app.vercel.app/api/auth/callback/azure-ad`

## Email Whitelist Configuration

### Adding Approved Emails

Edit `auth-module/whitelist.json`:

```json
{
  "approvedEmails": [
    "user1@example.com",
    "user2@company.com",
    "admin@outlook.com"
  ]
}
```

### Using Environment Variables (Alternative)

Set `APPROVED_EMAILS` in your `.env` file:

```env
APPROVED_EMAILS=user1@example.com,user2@company.com,admin@outlook.com
```

### Admin Panel

Access the admin panel at `/admin/whitelist` to manage approved emails through the UI.
Only admin emails (configured in the code) can access this panel.

### How It Works

1. User signs in with Microsoft account
2. System checks if their email is in the whitelist
3. If approved → Access granted to dashboard
4. If not approved → Redirected to error page

## Protected Routes

To protect any route, use the middleware or check session in your components:

```tsx
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function ProtectedPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  if (!session) redirect('/auth/signin')

  return <div>Welcome {session.user?.email}</div>
}
```

## Deployment to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXTAUTH_URL` = `https://your-app.vercel.app`
   - `NEXTAUTH_SECRET` = (generate new secret)
   - `AZURE_AD_CLIENT_ID` = (from Azure)
   - `AZURE_AD_CLIENT_SECRET` = (from Azure)
4. Deploy!

## Features

- ✅ **Email whitelist protection** - Only approved emails can access
- ✅ Works with personal Microsoft accounts (@outlook.com, @live.com)
- ✅ Works with work/school accounts
- ✅ Admin panel for managing whitelist
- ✅ Multi-tenant support
- ✅ Session management
- ✅ Route protection
- ✅ Customizable sign-in page

## Support

This module uses the shared Azure AD app registration. Contact your administrator for access to the Azure Portal if you need to make changes.