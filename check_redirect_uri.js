// Quick check of what redirect URI NextAuth expects vs what you have configured

console.log('🔍 CHECKING REDIRECT URI CONFIGURATION');
console.log('');
console.log('NextAuth expects this redirect URI:');
console.log('✅ http://localhost:3010/api/auth/callback/azure-ad');
console.log('');
console.log('Common variations that might be configured in Azure instead:');
console.log('❌ http://localhost:3010/auth/callback');
console.log('❌ http://localhost:3010/api/auth/callback');
console.log('❌ http://localhost:3006/api/auth/callback/azure-ad (old port)');
console.log('❌ http://localhost:3007/api/auth/callback/azure-ad (old port)');
console.log('');
console.log('SOLUTION:');
console.log('1. Go to Azure portal → App registrations → Your app');
console.log('2. Click "Authentication" in left menu'); 
console.log('3. Under "Redirect URIs", add:');
console.log('   http://localhost:3010/api/auth/callback/azure-ad');
console.log('4. Make sure it ends with "/azure-ad" (provider name)');
console.log('5. Save the configuration');
console.log('');
console.log('The redirect URI must EXACTLY match what NextAuth sends!');