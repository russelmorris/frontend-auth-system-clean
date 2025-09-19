# Vercel Deployment Instructions

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel
- Azure AD application configured

## Deployment Steps

### 1. Deploy from Main Branch
The `main` branch contains the stable authentication system with email whitelist functionality.

```bash
# Ensure you're deploying from main branch
git checkout main
git push origin main
```

### 2. Configure Environment Variables in Vercel

Go to your Vercel project settings > Environment Variables and add:

```env
# Azure AD Authentication
AZURE_AD_CLIENT_ID=your_client_id_here
AZURE_AD_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-vercel-app.vercel.app

# Weaviate Database
WEAVIATE_URL=your_weaviate_url_here
WEAVIATE_API_KEY=your_weaviate_api_key_here

# OpenAI (for embeddings)
OPENAI_API_KEY=your_openai_api_key_here

# Email Whitelist (comma-separated)
APPROVED_EMAILS=russ@skyeam.com.au,russel.d.j.morris@gmail.com
```

### 3. Azure AD Redirect URIs

Add these redirect URIs to your Azure AD app registration:

**For Production (Vercel):**
- `https://your-vercel-app.vercel.app/api/auth/callback/azure-ad`
- `https://frontend-auth-system-clean.vercel.app/api/auth/callback/azure-ad`

**For Preview Deployments:**
- `https://*.vercel.app/api/auth/callback/azure-ad`

### 4. Deployment Configuration

Create/update `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sfo1"],
  "functions": {
    "app/api/auth/[...nextauth]/route.ts": {
      "maxDuration": 30
    },
    "app/api/semantic-search/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 5. Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Import your GitHub repository in Vercel
2. Select `main` branch as production branch
3. Configure environment variables
4. Click Deploy

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from main branch)
vercel --prod
```

### 6. Post-Deployment Verification

1. Test authentication flow:
   - Visit `https://your-app.vercel.app`
   - Click "Continue with Microsoft"
   - Verify only whitelisted emails can access

2. Check API endpoints:
   - `/api/auth/session` - Should return session data when logged in
   - `/api/semantic-search` - Should connect to Weaviate

3. Monitor logs in Vercel dashboard for any errors

## Managing Email Whitelist

### Option 1: Update whitelist.json (Recommended)
Edit `auth-module/whitelist.json` and redeploy:

```json
{
  "approvedEmails": [
    "russ@skyeam.com.au",
    "russel.d.j.morris@gmail.com",
    "new.email@example.com"
  ]
}
```

### Option 2: Environment Variable
Update `APPROVED_EMAILS` in Vercel dashboard (comma-separated list)

## Troubleshooting

### Authentication Issues
- Verify NEXTAUTH_URL matches your Vercel URL exactly
- Check Azure AD redirect URIs include your Vercel domain
- Ensure NEXTAUTH_SECRET is set (generate with `openssl rand -base64 32`)

### Database Connection Issues
- Verify Weaviate URL and API key are correct
- Check Weaviate cluster is accessible from Vercel's IP ranges

### Email Whitelist Not Working
- Check emails are lowercase in whitelist
- Verify APPROVED_EMAILS environment variable format
- Check Vercel logs for whitelist loading errors

## Branch Strategy

- **main**: Production-ready code with stable authentication
- **development**: Active development and testing
- Feature branches: Create from development for new features

## Support

For issues with:
- Azure AD configuration: Check Azure Portal > App Registrations
- Vercel deployment: Check Vercel dashboard logs
- Authentication flow: Enable debug mode with `DEBUG=next-auth:*`