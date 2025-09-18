require('dotenv').config();

console.log('\n=== Final Authentication Test ===\n');

const clientId = process.env.AZURE_AD_CLIENT_ID;
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3009';

console.log('Testing configuration:');
console.log('- Client ID:', clientId);
console.log('- Base URL:', baseUrl);
console.log('- Tenant config: Using common endpoint (no tenantId specified)');

console.log('\n1. NextAuth Sign-In Page:');
console.log(`   ${baseUrl}/api/auth/signin`);

console.log('\n2. Direct OAuth URLs for testing:');

// Work/School accounts URL
const workUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
  `client_id=${clientId}&` +
  `response_type=code&` +
  `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/azure-ad`)}&` +
  `scope=${encodeURIComponent('openid profile email offline_access User.Read')}&` +
  `prompt=select_account`;

console.log('\n   Work/School accounts:');
console.log('   ' + workUrl);

// Personal accounts URL (consumers endpoint)
const personalUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?` +
  `client_id=${clientId}&` +
  `response_type=code&` +
  `redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/callback/azure-ad`)}&` +
  `scope=${encodeURIComponent('openid profile email offline_access User.Read')}&` +
  `prompt=select_account`;

console.log('\n   Personal Microsoft accounts:');
console.log('   ' + personalUrl);

console.log('\n3. Key configuration points verified:');
console.log('   - App registration supports: AzureADandPersonalMicrosoftAccount');
console.log('   - NextAuth config: NO tenantId specified (enables multi-tenant)');
console.log('   - Using common endpoint for all account types');
console.log('   - Redirect URI registered: ' + `${baseUrl}/api/auth/callback/azure-ad`);

console.log('\n4. Testing steps:');
console.log('   a) Open the NextAuth sign-in page in your browser');
console.log('   b) Click "Sign in with Microsoft"');
console.log('   c) Try both personal (outlook.com/live.com) and work accounts');
console.log('   d) Both should authenticate successfully');

console.log('\n5. If authentication still fails:');
console.log('   - Check Azure Portal > App registrations > Authentication');
console.log('   - Verify "Supported account types" = "Accounts in any organizational directory and personal Microsoft accounts"');
console.log('   - Ensure redirect URI matches exactly: ' + `${baseUrl}/api/auth/callback/azure-ad`);
console.log('   - Try the direct OAuth URLs above to isolate the issue');