# Code Documentation: Microsoft Azure AD Authentication System

## ⚠️ AUTHENTICATION PARTIALLY WORKING - WHITELIST ADMIN ISSUE

**Status**: Authentication works but admin whitelist page has redirect loop issue.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 AUTHENTICATION ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User → Sign-in Page → Microsoft Login → Token Exchange    │
│    ↓                                        ↓              │
│  Dashboard ← Session Created ← Callback ← Azure AD         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Current Implementation

### Authentication Provider
- **Type**: Microsoft Azure AD with NextAuth.js
- **Supports**: Both personal Microsoft accounts and work/school accounts
- **Tenant**: Common endpoint (multi-tenant)
- **App Name**: front-end-2

### Azure App Configuration
```
Client ID: 65d76e79-bc39-4f21-89cd-cf9f6a49401b
Secret ID: 3fd4c7e1-fee6-45d1-a34e-f649df0b1beb
Redirect URIs:
  - http://localhost:3010/api/auth/callback/azure-ad
  - https://your-app.vercel.app/api/auth/callback/azure-ad (add your domain)
```

## Directory Structure

```
frontEndAuth/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts         # NextAuth API endpoints
│   ├── auth/
│   │   └── signin/
│   │       └── page.tsx             # Sign-in page
│   ├── dashboard/
│   │   └── page.tsx                 # Protected dashboard
│   └── layout.tsx                   # Root layout with SessionProvider
├── auth-module/                     # Modular authentication package
│   ├── README.md                    # Deployment instructions
│   ├── .env.example                 # Environment variables template
│   └── api-auth/                   # Auth files for copying
├── middleware.ts                    # Route protection
└── .env                            # Environment configuration
```

## Key Files

### 1. NextAuth Configuration (`app/api/auth/[...nextauth]/route.ts`)
- Configures Azure AD provider
- Handles token exchange and session creation
- Manages callbacks for sign-in success

### 2. Sign-in Page (`app/auth/signin/page.tsx`)
- Simple interface with "Sign in with Microsoft" button
- Redirects to Microsoft login
- Shows support for both account types

### 3. Middleware (`middleware.ts`)
- Protects routes requiring authentication
- Redirects unauthenticated users to sign-in

## Environment Variables

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3010
NEXTAUTH_SECRET=your-secret-here

# Azure AD
AZURE_AD_CLIENT_ID=65d76e79-bc39-4f21-89cd-cf9f6a49401b
AZURE_AD_CLIENT_SECRET=YOUR_AZURE_CLIENT_SECRET_HERE
```

## Deployment to Vercel

### Prerequisites
1. Add your Vercel production URL to Azure app registration:
   - Go to Azure Portal → App registrations → front-end-2
   - Add redirect URI: `https://your-app.vercel.app/api/auth/callback/azure-ad`

### Environment Variables for Vercel
```env
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[generate-new-secret]
AZURE_AD_CLIENT_ID=65d76e79-bc39-4f21-89cd-cf9f6a49401b
AZURE_AD_CLIENT_SECRET=YOUR_AZURE_CLIENT_SECRET_HERE
```

## Modular Authentication Package

The `auth-module` folder contains a standalone authentication package that can be deployed to any Next.js application:

### Features
- Pre-configured Azure AD authentication
- Support for personal and work accounts
- Session management
- Route protection
- Easy deployment

### Usage
1. Copy the `auth-module` folder to your Next.js project
2. Install dependencies: `npm install next-auth`
3. Copy the environment variables
4. Add redirect URIs to Azure app registration
5. Deploy!

## Testing

### Local Testing
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3010`
3. Click "Sign in with Microsoft"
4. Test with both personal and work accounts

### Production Testing
1. Deploy to Vercel
2. Update NEXTAUTH_URL in Vercel environment variables
3. Add production redirect URI to Azure app
4. Test authentication flow

## Known Issues

### 🔴 CRITICAL: Admin Whitelist Page Redirect Loop
**Problem**: `/admin/whitelist` page redirects back to dashboard instead of displaying
- When trying to access the whitelist management page at `/admin/whitelist`
- Page bounces back to dashboard even for admin users
- Issue persists despite middleware configuration updates

**Attempted Fixes**:
- Updated middleware matcher to include `/admin/:path*`
- Modified session handling in whitelist page component
- Added issuer configuration to Azure AD provider
- Fixed OAuth callback errors

**Status**: UNRESOLVED - Needs investigation

## Troubleshooting

### Common Issues

1. **"State cookie was missing" error**
   - Clear browser cookies for localhost
   - Ensure NEXTAUTH_URL matches your domain

2. **"redirect_uri mismatch" error**
   - Add exact redirect URI to Azure app registration
   - Check for trailing slashes

3. **Dashboard not loading after auth**
   - Check if API endpoints are configured
   - Verify database connections

4. **Admin whitelist page redirect loop**
   - Currently unresolved
   - Page keeps bouncing back to dashboard
   - Affects `/admin/whitelist` route

## Security Notes

- Never commit `.env` file to git
- Rotate secrets regularly
- Use HTTPS in production
- Keep NextAuth.js updated

## Support

For issues with:
- **Authentication**: Check Azure AD app configuration
- **Dashboard**: Verify API endpoints and database
- **Deployment**: Check Vercel environment variables

---

Last Updated: 2025-09-18
Status: ✅ Authentication Working