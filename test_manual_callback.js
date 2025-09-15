const { chromium } = require('playwright');

(async () => {
  console.log('🔍 MANUAL CALLBACK SIMULATION TEST');
  console.log('===================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // First, create a valid state by going through the auth flow
  console.log('1️⃣ Setting up valid auth state...');
  await page.goto('http://localhost:3010/auth/signin');
  await page.waitForTimeout(2000);
  
  // Click to get a state cookie
  await page.click('button:has-text("Continue with Microsoft")');
  await page.waitForTimeout(3000);
  
  // Get the state from the URL or cookies
  const currentUrl = page.url();
  let stateFromUrl = '';
  if (currentUrl.includes('state=')) {
    const url = new URL(currentUrl);
    stateFromUrl = url.searchParams.get('state');
    console.log(`✅ Found state parameter: ${stateFromUrl}`);
  }
  
  // Get cookies to see the state cookie
  const cookies = await context.cookies();
  let stateCookie = '';
  cookies.forEach(cookie => {
    if (cookie.name === 'next-auth.state') {
      stateCookie = cookie.value;
      console.log(`🍪 Found state cookie: ${stateCookie.substring(0, 50)}...`);
    }
  });
  
  // Now simulate the callback that Microsoft would send
  console.log('\n2️⃣ Simulating Microsoft callback...');
  
  // Create a fake authorization code (Microsoft would send a real one)
  const fakeAuthCode = 'test_auth_code_12345';
  
  // Create the callback URL with proper parameters
  const callbackUrl = `http://localhost:3010/api/auth/callback/azure-ad?code=${fakeAuthCode}&state=${stateFromUrl}`;
  
  console.log(`📤 CALLBACK URL: ${callbackUrl}`);
  
  // Try the callback
  try {
    const response = await page.goto(callbackUrl);
    const status = response.status();
    console.log(`📥 CALLBACK RESPONSE: ${status}`);
    
    if (status >= 400) {
      const text = await response.text();
      console.log(`❌ ERROR RESPONSE BODY:\n${text.substring(0, 500)}...`);
    } else {
      console.log(`✅ CALLBACK SUCCESS: ${page.url()}`);
    }
    
  } catch (error) {
    console.log(`❌ CALLBACK ERROR: ${error.message}`);
  }
  
  // Check final state
  console.log('\n3️⃣ Checking final auth state...');
  
  try {
    const sessionResponse = await page.goto('http://localhost:3010/api/auth/session');
    const sessionData = await sessionResponse.json();
    console.log(`📋 SESSION: ${JSON.stringify(sessionData, null, 2)}`);
  } catch (e) {
    console.log('❌ Could not check session');
  }
  
  await page.waitForTimeout(10000);
  await browser.close();
  
  console.log('\n🔍 ANALYSIS:');
  console.log('If the callback failed with 400, the issue is likely:');
  console.log('1. State parameter mismatch between cookie and URL');
  console.log('2. Invalid authorization code format');
  console.log('3. Missing required callback parameters');
  console.log('4. Azure redirect URI configuration mismatch');
  
})();