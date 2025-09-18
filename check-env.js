require('dotenv').config();

console.log('\n=== Environment Check ===');
console.log('AZURE_AD_TENANT_ID:', process.env.AZURE_AD_TENANT_ID);
console.log('AZURE_AD_CLIENT_ID:', process.env.AZURE_AD_CLIENT_ID);
console.log('AZURE_AD_CLIENT_SECRET:', process.env.AZURE_AD_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

const expectedTenant = '85a3833a-20b8-479e-bf9f-bcda47fae437';
const expectedClient = 'bfc2a4f4-4357-40c9-8ed6-cab30ab946a8';

if (process.env.AZURE_AD_TENANT_ID !== expectedTenant) {
    console.log('\nWARNING: Tenant ID does not match expected value!');
    console.log('Expected:', expectedTenant);
    console.log('Got:', process.env.AZURE_AD_TENANT_ID);
}

if (process.env.AZURE_AD_CLIENT_ID !== expectedClient) {
    console.log('\nWARNING: Client ID does not match expected value!');
    console.log('Expected:', expectedClient);
    console.log('Got:', process.env.AZURE_AD_CLIENT_ID);
}

console.log('\nAuth URL will be:');
console.log(`https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`);