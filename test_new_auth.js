const { chromium } = require('playwright');

(async () => {
  console.log('🔍 TESTING NEW CUSTOM OAUTH CONFIGURATION');
  console.log('==========================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Network logging
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (url.includes('localhost:3010') || url.includes('auth') || url.includes('callback')) {
      console.log(`📡 ${status} ${url}`);
      if (status >= 400) {
        console.log(`❌ ERROR: ${status} ${url}`);
      }
    }
  });
  
  // Console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🔴 CONSOLE ERROR: ${msg.text()}`);
    }
  });
  
  try {
    console.log('\n1️⃣ Testing sign-in page...');
    await page.goto('http://localhost:3010/auth/signin');
    await page.waitForTimeout(3000);
    
    console.log('2️⃣ Clicking Continue with Microsoft...');
    await page.click('button:has-text("Continue with Microsoft")');
    
    console.log('3️⃣ Waiting for Microsoft OAuth...');
    await page.waitForURL('**/oauth2/**', { timeout: 10000 });
    
    const currentUrl = page.url();
    console.log(`📍 OAuth URL: ${currentUrl}`);
    
    // Check if we get the login form
    await page.waitForTimeout(3000);
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('✅ Reached Microsoft login form');
      await emailInput.fill('info@consultai.com.au');
      await page.click('input[type="submit"], button[type="submit"]');
      console.log('📧 Email submitted, waiting for next step...');
      
      // Wait a bit longer for manual completion
      console.log('⏳ Waiting 30 seconds for manual authentication...');
      await page.waitForTimeout(30000);
    }
    
    // Check final result
    const finalUrl = page.url();
    console.log(`🏁 Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('dashboard')) {
      console.log('🎉 SUCCESS! Authenticated and redirected to dashboard!');
    } else if (finalUrl.includes('signin')) {
      console.log('❌ Back on sign-in page - authentication failed');
    } else {
      console.log('⚠️ Unexpected final location');
    }
    
    // Check session
    try {
      const sessionResponse = await page.goto('http://localhost:3010/api/auth/session');
      const sessionData = await sessionResponse.json();
      console.log(`📋 SESSION: ${JSON.stringify(sessionData, null, 2)}`);
    } catch (e) {
      console.log('❌ Could not check session');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await page.waitForTimeout(15000);
  await browser.close();
  
})();