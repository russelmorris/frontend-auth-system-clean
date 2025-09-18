require('dotenv').config();

console.log('\n=== Authentication URL Check ===\n');

const clientId = process.env.AZURE_AD_CLIENT_ID;
const tenantId = process.env.AZURE_AD_TENANT_ID;

console.log('Client ID:', clientId);
console.log('Tenant ID:', tenantId);

// Build the authorization URL
const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
  `client_id=${clientId}&` +
  `response_type=code&` +
  `redirect_uri=${encodeURIComponent('http://localhost:3300/api/auth/callback/azure-ad')}&` +
  `scope=${encodeURIComponent('openid profile email User.Read')}&` +
  `prompt=select_account`;

console.log('\nAuthorization URL for testing:');
console.log(authUrl);

console.log('\nTest this URL directly in your browser.');
console.log('If it works with work accounts but not personal, the app registration needs fixing.');
console.log('\nFor personal accounts to work, the app MUST be registered with:');
console.log('- signInAudience: "AzureADandPersonalMicrosoftAccount"');
console.log('- Live SDK support: Yes');