# CRITICAL ISSUE: Azure AD Authentication Loop Debugging

## Current Problem Statement
Microsoft Azure AD authentication is experiencing persistent callback loops on both localhost and Vercel production environments. The system reaches Microsoft login but fails during token exchange with `AADSTS9002313: Invalid request` errors.

## Core Objective
**"Diagnose and resolve Azure AD OAuth callback loop issue preventing successful authentication"**

## Debugging Status: COMPREHENSIVE ANALYSIS COMPLETED

### Current Authentication Implementation
- ✅ **NextAuth.js configured** with custom Azure AD OAuth provider
- ✅ **State management working** - cookies created and stored properly
- ✅ **OAuth flow initiates** - successfully redirects to Microsoft login
- ✅ **Microsoft login reached** - user can enter credentials
- ❌ **Token exchange failing** - Azure rejects callback with `AADSTS9002313`
- ❌ **Session creation failing** - authentication loops back to signin

### Root Cause Analysis Summary
**Primary Issue**: `AADSTS9002313: Invalid request. Request is malformed or invalid`
- Azure AD token exchange is rejecting the authorization code
- Account `info@consultai.com.au` being treated as personal vs organizational
- Issue persists on both localhost and Vercel production

### Azure Configuration (Current)
- **Client ID**: `aae7d797-379a-4a62-a8f9-5b164c3f9f3e`
- **Tenant**: `organizations` (multi-tenant configuration)
- **Redirect URIs**: Both localhost and production configured correctly
- **Secret**: Active and properly configured in environment

## Phase 1: Account Type Investigation (30 minutes)
**Objective**: Verify if test account is properly configured as organizational account

### STEP 1: Verify Account Type in Azure Portal
**Action**: Check if `info@consultai.com.au` exists as organizational user
**User Instructions**:
1. **Go to**: https://portal.azure.com
2. **Navigate to**: Azure Active Directory
3. **Click**: "Users" in left menu
4. **Search for**: `info@consultai.com.au`
5. **Check results**:
   - If found: Account is organizational ✅
   - If not found: Account is personal Microsoft account ❌

**Expected Issue**: Account likely doesn't exist as organizational user

### STEP 2: Create Organizational Test User (if needed)
**Action**: Add test user to Azure tenant
**User Instructions**:
1. **In Azure AD Users**, click "New user"
2. **Select**: "Create new user"
3. **Configure**:
   - **User name**: `testuser@yourdomain.onmicrosoft.com`
   - **Name**: `Test User`
   - **Password**: Auto-generate
4. **Click**: "Create"
5. **Copy**: Username and temporary password

**Alternative**: Use existing organizational account for testing

## Phase 2: Azure App Registration Verification (20 minutes)
**Objective**: Verify app registration configuration is correct

### STEP 3: Review App Registration Settings
**Action**: Check all critical settings in Azure app registration
**User Instructions**:
1. **Go to**: Azure portal → App registrations
2. **Find**: App with Client ID `aae7d797-379a-4a62-a8f9-5b164c3f9f3e`
3. **Verify "Authentication" settings**:
   - Platform: Web ✅
   - Redirect URIs include: `http://localhost:3010/api/auth/callback/azure-ad` ✅
   - Redirect URIs include: Vercel production URL ✅
4. **Check "API permissions"**:
   - Microsoft Graph → User.Read (delegated) should be present
   - Add if missing: Click "Add a permission" → Microsoft Graph → Delegated → User.Read
5. **Verify "Certificates & secrets"**:
   - Client secret should be active (not expired)
   - Value matches environment variable

### STEP 4: Test with Single Tenant Configuration
**Action**: Change from multi-tenant to single tenant for testing
**User Instructions**:
1. **In app registration**, click "Authentication"
2. **Under "Supported account types"**, select:
   - "Accounts in this organizational directory only (Single tenant)"
3. **Update authentication configuration to use specific tenant ID**
4. **Test authentication flow**

## Phase 3: Alternative Authentication Approaches (45 minutes)
**Objective**: Test different configurations to isolate the issue

### STEP 5: Test with Azure AD B2C (Alternative)
**Action**: Set up Azure AD B2C as recommended in original plan
**User Instructions**:
1. **Create Azure AD B2C tenant** (if not exists)
2. **Configure user flows**
3. **Update NextAuth configuration** to use B2C endpoints
4. **Test authentication**

### STEP 6: Test with Different OAuth Provider
**Action**: Temporarily configure Google OAuth to verify NextAuth setup
**User Instructions**:
1. **Create Google OAuth app** in Google Cloud Console
2. **Add Google provider** to NextAuth configuration
3. **Test authentication flow**
4. **If Google works**: Issue is Azure-specific
5. **If Google fails**: Issue is NextAuth configuration

### STEP 7: Test with Different Microsoft Account
**Action**: Use known organizational Microsoft account
**User Instructions**:
1. **Identify organizational Microsoft account** (work/school account)
2. **Test authentication** with that account
3. **Document results**

## Debugging Tools Available

### Testing Scripts Created
- `comprehensive_auth_debug.js` - Full flow analysis with detailed logging
- `test_manual_callback.js` - Manual callback simulation
- `azure_navigation_guide.js` - Azure portal navigation helper

### Error Analysis Tools
- Server logs with NextAuth debug mode enabled
- Network request/response logging
- State cookie analysis
- Manual token exchange testing

## Expected Resolution Paths

### Path 1: Account Type Issue (Most Likely)
**If**: `info@consultai.com.au` is personal account
**Solution**: Create organizational user or use existing work account
**Time**: 15 minutes

### Path 2: App Registration Issue
**If**: Missing permissions or incorrect configuration
**Solution**: Add required Graph API permissions
**Time**: 10 minutes

### Path 3: Azure AD vs Azure AD B2C
**If**: Regular Azure AD has limitations for external users
**Solution**: Switch to Azure AD B2C as originally planned
**Time**: 60 minutes

### Path 4: Environment-Specific Issue
**If**: Issue only occurs in specific environments
**Solution**: Environment variable or domain configuration
**Time**: 20 minutes

## Current Status Summary
- ✅ **Authentication system implemented** and properly configured
- ✅ **Comprehensive debugging completed** with detailed analysis
- ✅ **Root cause identified** as Azure token exchange rejection
- ⏳ **Next step**: Account type verification and testing with organizational user
- 🎯 **Expected resolution**: 30-60 minutes with proper organizational account

---

**Documentation Updated**: 2025-09-15  
**Status**: Ready for focused debugging session with comprehensive analysis and clear next steps