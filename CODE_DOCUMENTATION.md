# Code Documentation: Microsoft Azure AD Authentication System

## Current Status: AUTHENTICATION LOOP ISSUE

**CRITICAL**: Authentication system is experiencing persistent callback loops on both localhost and Vercel production environments. The issue has been comprehensively debugged and documented below.

## Authentication Architecture (Current Implementation)

This is a Next.js 15.5.2 freight analytics dashboard with Microsoft Azure AD authentication implementation. The system uses NextAuth.js with a custom OAuth provider configuration for Microsoft organizational accounts.

```
┌─────────────────────────────────────────────────────────────┐
│                AZURE AD AUTHENTICATION FLOW                │
├─────────────────────────────────────────────────────────────┤
│ 1. User Request → NextAuth → Azure AD OAuth                │
│ 2. Microsoft Login → Token Exchange → Session Creation     │
│ 3. Callback Redirect → Protected Routes → Dashboard        │
│ ❌ ISSUE: Step 2-3 failing with OAuthCallback errors      │
└─────────────────────────────────────────────────────────────┘
```

## Comprehensive Debug Analysis (2025-09-15)

### Root Cause Identified
**Primary Issue**: `AADSTS9002313: Invalid request. Request is malformed or invalid`
- Azure is rejecting the token exchange request during the OAuth callback
- The authentication flow reaches Microsoft login but fails on return
- Issue persists on both localhost and Vercel production environments

### Debug Session Findings

#### ✅ Working Components
1. **NextAuth Configuration**: Correctly set up and functioning
2. **State Cookie Management**: State cookies are created and stored properly
3. **OAuth Flow Initiation**: Successfully redirects to Microsoft login
4. **Microsoft Login Pages**: Reach login form and accept credentials
5. **Callback Endpoint**: Receives requests but fails during token exchange

#### ❌ Failing Components
1. **Token Exchange**: Azure rejects the authorization code exchange
2. **Account Type Detection**: Personal vs organizational account confusion
3. **Callback Processing**: OAuthCallback errors causing loops
4. **Session Creation**: No valid session created after authentication

### Technical Details

#### Current Azure Configuration
- **Client ID**: `aae7d797-379a-4a62-a8f9-5b164c3f9f3e`
- **Tenant**: `organizations` (multi-tenant)
- **Redirect URIs**: 
  - `http://localhost:3010/api/auth/callback/azure-ad`
  - Vercel production URL (added)

#### Authentication Flow Sequence
1. ✅ User clicks "Continue with Microsoft"
2. ✅ NextAuth creates state cookie and redirects to Azure
3. ✅ Azure displays login form for `info@consultai.com.au`
4. ❌ Account redirected to `login.live.com` (personal account)
5. ❌ Token exchange fails with `AADSTS9002313`
6. ❌ User redirected back to signin with `error=OAuthCallback`

#### Error Analysis
```
[next-auth][error][OAUTH_CALLBACK_ERROR] 
invalid_grant (AADSTS9002313: Invalid request. Request is malformed or invalid.
Trace ID: 70823286-54df-4607-b29c-89246f8b5700
```

### Account Configuration Issue
The email `info@consultai.com.au` is being treated as a **personal Microsoft account** rather than an organizational account, causing redirect to `login.live.com` instead of organizational authentication.

## Current Implementation Status

### Files Modified
- ✅ `lib/auth.ts` - Custom OAuth provider configuration
- ✅ `app/api/auth/[...nextauth]/route.ts` - NextAuth API endpoints
- ✅ `app/auth/signin/page.tsx` - Sign-in page
- ✅ `app/layout.tsx` - Session provider wrapper
- ✅ `components/providers/SessionProvider.tsx` - Client-side session provider
- ✅ `middleware.ts` - Route protection
- ✅ `.env` - Environment variables configured

### Current Authentication Configuration
```typescript
// lib/auth.ts - Custom OAuth Provider
export const authOptions: NextAuthOptions = {
  debug: true,
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
  trustHost: true,
  useSecureCookies: false,
  // ... rest of configuration
}
```

### Comprehensive Debugging Completed
1. ✅ **Selenium/Playwright Testing** - Automated flow testing
2. ✅ **Network Request Analysis** - Detailed request/response logging
3. ✅ **State Cookie Analysis** - Cookie creation and persistence verified
4. ✅ **Manual Callback Simulation** - Direct callback URL testing
5. ✅ **Server Log Analysis** - Error identification and tracing
6. ✅ **Multiple Provider Configurations** - Both AzureADProvider and custom OAuth tested

### Testing Tools Created
- `comprehensive_auth_debug.js` - Full authentication flow testing
- `test_manual_callback.js` - Manual callback simulation
- `test_new_auth.js` - Custom OAuth provider testing
- `azure_navigation_guide.js` - Azure portal configuration guide

## Next Debugging Strategy

### Potential Solutions to Investigate
1. **Account Type Correction**
   - Verify if `info@consultai.com.au` needs to be added as organizational account
   - Test with known organizational Microsoft account
   - Consider creating dedicated test user in Azure tenant

2. **Azure App Registration Review**
   - Verify API permissions in Azure portal
   - Check certificate/secret expiration
   - Review supported account types configuration

3. **Alternative Provider Approach**
   - Test with different OAuth provider (Google) to isolate Azure-specific issues
   - Try Azure AD B2C instead of regular Azure AD
   - Consider Microsoft Graph API direct integration

4. **Environment-Specific Testing**
   - Test with different email accounts
   - Try authentication on different development environments
   - Verify production vs development environment differences

## Current Status: Ready for Focused Debugging

The codebase has been **completely cleaned** of all previous authentication implementations to provide a fresh start for Microsoft Entra External ID integration. This ensures:
- No conflicting authentication libraries
- Clean dependency tree
- Fresh environment variable space
- Pure frontend dashboard functionality

## Directory Structure (Post-Cleanup)

```
frontend-auth-system/
├── .claude/                          # Development documentation
│   ├── CLAUDE.md                     # Development standards  
│   ├── SECURITY-GUARANTEE.md         # Security analysis
│   └── projecttodos.md               # Azure AD B2C implementation plan
├── app/                              # Next.js App Router structure
│   ├── api/                          # API route handlers (freight data only)
│   │   ├── quotes/                   # Quote data APIs
│   │   ├── search/                   # Search functionality  
│   │   ├── semantic-search/          # AI-powered search
│   │   ├── aggregations/             # Data aggregation
│   │   └── weaviate-schema/          # Vector database schema
│   ├── dashboard/                    # Protected dashboard (ready for auth)
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout (cleaned)
│   └── page.tsx                      # Landing page
├── components/                       # React components (non-auth)
│   ├── quotes/                       # Quote display components
│   ├── search/                       # Search interface components  
│   └── ui/                           # Reusable UI components
├── lib/                              # Core libraries and utilities
│   ├── openai/                       # OpenAI integration
│   ├── weaviate/                     # Weaviate client
│   └── types/                        # TypeScript definitions
└── package.json                      # Dependencies (auth-free)
```

## Removed Components (Ready for Azure Integration)

### Authentication Files Removed:
- ❌ `lib/auth.ts` - NextAuth configuration
- ❌ `middleware.ts` - Route protection middleware
- ❌ `app/auth/` - Authentication pages
- ❌ `app/api/auth/` - Authentication API routes  
- ❌ `components/auth/` - Authentication components
- ❌ `prisma/` - Database schemas
- ❌ `app/api/invitations/` - Invitation system APIs

### Dependencies Cleaned:
- ❌ `next-auth` - Will be replaced with Azure AD B2C specific version
- ❌ `@next-auth/prisma-adapter` - No database needed with Azure B2C
- ❌ `@prisma/client` - User data stored in Microsoft's cloud
- ❌ `prisma` - Schema management handled by Azure
- ❌ `jsonwebtoken` - JWT handled by Microsoft
- ❌ `bcryptjs` - Password hashing not needed
- ❌ `nodemailer` - Email handled by Azure B2C
- ❌ `uuid` - Token generation handled by Microsoft

## Core Preserved Functionality

### 1. Freight Analytics Dashboard (`app/dashboard/`)

**Purpose**: Complete freight analytics interface ready for authentication gate

**Preserved Features**:
- Quote data visualization with Recharts
- Advanced table filtering with @tanstack/react-table  
- Semantic search with Weaviate integration
- Natural language query parsing with OpenAI
- PDF document handling and downloads
- Data aggregation and analytics

### 2. Search System (`lib/weaviate/`, `lib/openai/`)

**Purpose**: AI-powered freight data search and analysis

**Components**:
- Vector database queries for semantic search
- OpenAI API integration for natural language processing
- Quote matching and similarity algorithms
- Document indexing and retrieval

### 3. API Infrastructure (`app/api/`)

**Purpose**: Backend services for freight data operations

**Endpoints**:
- `GET /api/quotes` - Freight quote retrieval
- `POST /api/search` - Standard search functionality
- `POST /api/semantic-search` - AI-powered search
- `GET /api/aggregations` - Data analysis endpoints
- `POST /api/parse-query` - Natural language parsing
- `GET /api/download/[filename]` - Document downloads

### 4. UI Component System (`components/`)

**Purpose**: Reusable interface components for freight analytics

**Component Categories**:
- Data visualization components (charts, tables)
- Search interface components
- Document display components  
- Form and input components (Radix UI based)
- Loading and error state components

## Azure AD B2C Integration Strategy

### Why Azure AD B2C Over Custom OAuth

**Enterprise Benefits**:
- ✅ **No user limits** - Unlimited external users vs Google's 100-user dev limit
- ✅ **No approval process** - Deploy immediately vs weeks of Google verification  
- ✅ **Prepackaged UI** - Microsoft provides all login/signup screens
- ✅ **Enterprise security** - SOC 2, ISO 27001, GDPR compliance built-in
- ✅ **Invitation system** - Built-in invitation workflow through Azure portal
- ✅ **Multiple identity providers** - Personal + business Microsoft accounts supported
- ✅ **Zero security maintenance** - Microsoft handles all security updates

**Development Benefits**:
- ✅ **90% prepackaged** - Minimal custom code required
- ✅ **Fast implementation** - 90 minutes vs weeks for custom solution
- ✅ **Professional appearance** - Enterprise-grade login experience
- ✅ **Mobile optimized** - Responsive design handled by Microsoft
- ✅ **Multi-factor auth** - Optional MFA with no additional development

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AZURE AD B2C ARCHITECTURE               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │   Next.js App   │────│  NextAuth.js     │              │
│  │   (Frontend)    │    │  (Integration)   │              │
│  └─────────────────┘    └──────────────────┘              │
│           │                       │                       │
│           │              ┌──────────────────┐              │
│           │              │  Azure AD B2C    │              │
│           │              │  (Identity)      │              │
│           │              │  • User Storage  │              │
│           │              │  • Login Screens │              │
│           │              │  • Invitations   │              │
│           │              │  • Security      │              │
│           │              └──────────────────┘              │
│           │                       │                       │
│  ┌─────────────────┐    ┌──────────────────┐              │
│  │   Dashboard     │────│  Route Protection│              │
│  │   (Protected)   │    │  (Middleware)    │              │
│  └─────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Azure AD B2C Setup (90 minutes)
**Deliverable**: Working Microsoft authentication with prepackaged UI

**Microsoft Provides**:
- User registration/login screens
- Password reset workflows  
- Account recovery systems
- Email verification processes
- Session management
- Security monitoring

**We Configure**:
- Azure AD B2C tenant creation
- User flow configuration
- App registration setup
- Environment variable configuration

### Phase 2: NextAuth Integration (45 minutes)
**Deliverable**: Seamless integration between frontend and Azure

**Components**:
- `lib/auth.ts` - Azure AD B2C provider configuration
- `app/api/auth/[...nextauth]/route.ts` - Authentication endpoints
- `app/auth/signin/page.tsx` - Simple entry point to Microsoft flow
- `middleware.ts` - Route protection using NextAuth middleware

### Phase 3: Custom Enhancements (4-6 hours)
**Deliverable**: Admin features and bulk operations

**Custom Features**:
- CSV bulk invitation upload interface
- Admin dashboard for user management  
- Domain filtering and access controls
- Integration with freight dashboard

## Security Architecture

### Microsoft-Handled Security (90% of protection)
- **Identity verification** - Microsoft validates all users
- **Session management** - Enterprise-grade token handling
- **Threat detection** - AI-powered anomaly detection
- **Compliance** - SOC 2, ISO 27001, GDPR built-in
- **Vulnerability management** - Microsoft security team handles patches
- **Multi-factor authentication** - Optional MFA with no custom code

### Application-Level Security (10% custom)
- **Route protection** - NextAuth middleware blocks unauthenticated access
- **Domain filtering** - Application-level email domain validation
- **Admin controls** - Custom role-based access for user management
- **API protection** - All freight data APIs require valid session

## Environment Configuration

### Required Azure Variables
```bash
# Azure AD B2C Configuration
AZURE_AD_B2C_TENANT_NAME=freight-auth
AZURE_AD_B2C_TENANT_ID=[Azure tenant ID]
AZURE_AD_B2C_CLIENT_ID=[App registration client ID] 
AZURE_AD_B2C_CLIENT_SECRET=[App secret]
AZURE_AD_B2C_PRIMARY_USER_FLOW=signup_signin_flow

# NextAuth Configuration  
NEXTAUTH_URL=https://your-vercel-domain.com
NEXTAUTH_SECRET=[256-bit random string]
```

### Preserved Environment Variables
```bash
# Freight Analytics APIs (unchanged)
WEAVIATE_URL=https://weaviate-cluster-url
WEAVIATE_API_KEY=weaviate-api-key
OPENAI_API_KEY=openai-api-key

# Application Settings (unchanged)
NODE_ENV=production
```

## User Experience Flow

### Authentication Flow
1. **User visits dashboard** → Redirected to `/auth/signin`
2. **Click "Continue with Microsoft"** → Redirect to Azure AD B2C
3. **Microsoft handles authentication** → Professional Microsoft login screen
4. **User authenticated** → Redirect back to dashboard with session
5. **Dashboard loads** → Full access to freight analytics

### Admin Experience (Phase 3)
1. **Admin logs in** → Access to standard dashboard  
2. **Navigate to /admin** → Access to user management panel
3. **Upload CSV file** → Bulk invitation system processes emails
4. **Invitations sent** → Azure AD B2C handles email delivery
5. **Track user status** → View invitation acceptance rates

## Development Advantages

### Versus Custom OAuth Implementation
| Feature | Custom OAuth | Azure AD B2C |
|---------|-------------|--------------|
| Development Time | 10-15 days | 90 minutes |
| User Limits | 100 (Google dev) | Unlimited |
| Security Maintenance | High | Zero |
| UI/UX Quality | Custom development needed | Professional Microsoft UI |
| Compliance | Manual implementation | Built-in certifications |
| Multi-factor Auth | Custom development | Toggle setting |
| Password Reset | Custom email system | Microsoft-handled |
| Mobile Support | Custom responsive design | Microsoft-optimized |

### Business Benefits
- **Faster time to market** - 90 minutes vs weeks of development
- **Lower maintenance costs** - Microsoft handles security updates
- **Enterprise credibility** - Professional Microsoft login experience  
- **Scalability** - Unlimited users from day one
- **Compliance ready** - Built-in SOC 2, ISO 27001, GDPR support
- **Professional support** - Microsoft enterprise support available

## Migration Path from Current State

### Current State: ✅ Clean Frontend
- Freight dashboard functionality preserved
- All authentication components removed  
- Dependencies cleaned and optimized
- Ready for Azure integration

### Next Steps: → Azure Integration
1. **User creates Azure AD B2C tenant** (30 minutes)
2. **Configure environment variables** (15 minutes)  
3. **Install NextAuth with Azure provider** (15 minutes)
4. **Deploy to Vercel** (15 minutes)
5. **Test authentication flow** (15 minutes)

### Future Enhancements: → Custom Features
- Admin dashboard for user management
- CSV bulk invitation system
- Advanced role-based access controls
- Integration with company directory services

## Testing Strategy

### Authentication Testing
- Microsoft login flow validation
- Session persistence testing  
- Route protection verification
- Sign-out functionality testing

### Integration Testing  
- Dashboard access post-authentication
- API endpoint protection validation
- Cross-browser compatibility testing
- Mobile device authentication testing

### Performance Testing
- Authentication flow speed measurement
- Dashboard load time with sessions
- Concurrent user authentication testing
- Azure AD B2C response time monitoring

---

**Current Status**: ✅ Clean slate ready for Azure AD B2C integration  
**Next Phase**: Azure AD B2C tenant setup and NextAuth integration  
**Time to Working Auth**: 90 minutes using prepackaged Microsoft solutions  
**Total Custom Development**: <8 hours for advanced features  

This architecture provides enterprise-grade authentication with minimal development time by leveraging Microsoft's proven identity platform while preserving all existing freight analytics functionality.