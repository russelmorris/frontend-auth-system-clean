const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Starting callback debug test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for ALL network requests to debug the callback
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('localhost:3010') || url.includes('auth') || url.includes('callback') || url.includes('error')) {
      console.log(`📡 ${status} ${url}`);
      
      // Log error responses in detail
      if (status >= 400) {
        console.log(`❌ ERROR RESPONSE: ${status} ${url}`);
      }
    }
  });
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('error') || msg.text().includes('Error')) {
      console.log('🔴 PAGE ERROR:', msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('🔴 PAGE EXCEPTION:', error.message);
  });
  
  try {
    console.log('1️⃣ Navigating to sign-in page...');
    await page.goto('http://localhost:3010/auth/signin');
    await page.waitForTimeout(2000);
    
    console.log('2️⃣ Clicking Continue with Microsoft...');
    await page.click('button:has-text("Continue with Microsoft")');
    
    console.log('3️⃣ Waiting for Microsoft OAuth flow...');
    await page.waitForURL('**/oauth2/**', { timeout: 15000 });
    
    // Wait for account picker or login form
    console.log('4️⃣ Looking for account selection or email input...');
    
    try {
      // Try to find account picker first
      const accountTiles = await page.locator('[data-test-id="account-tile"]').all();
      if (accountTiles.length > 0) {
        console.log(`✅ Found ${accountTiles.length} account tiles`);
        console.log('5️⃣ Clicking first account...');
        await accountTiles[0].click();
      } else {
        // Look for email input
        const emailInput = await page.locator('input[type="email"]').first();
        if (await emailInput.isVisible()) {
          console.log('5️⃣ Found email input, entering email...');
          await emailInput.fill('info@consultai.com.au');
          await page.click('input[type="submit"], button[type="submit"]');
          
          // Wait for password or next step
          await page.waitForTimeout(3000);
          
          // Check if we need password
          const passwordInput = await page.locator('input[type="password"]').first();
          if (await passwordInput.isVisible()) {
            console.log('⚠️ Password required - manual intervention needed');
          }
        }
      }
    } catch (error) {
      console.log('⚠️ No account picker found, continuing...');
    }
    
    console.log('6️⃣ Waiting for callback or completion...');
    
    // Wait for redirect back to our app
    let finalUrl = '';
    for (let i = 0; i < 20; i++) {
      await page.waitForTimeout(1000);
      finalUrl = page.url();
      
      if (finalUrl.includes('localhost:3010')) {
        console.log(`🔄 Back on our domain: ${finalUrl}`);
        break;
      }
      
      if (i === 19) {
        console.log('⏰ Timeout waiting for callback');
      }
    }
    
    // Analyze the final result
    if (finalUrl.includes('dashboard')) {
      console.log('🎉 SUCCESS! Redirected to dashboard');
    } else if (finalUrl.includes('signin')) {
      console.log('🔄 Back on sign-in page');
      
      const url = new URL(finalUrl);
      const error = url.searchParams.get('error');
      const callbackUrl = url.searchParams.get('callbackUrl');
      
      console.log(`❌ Error: ${error}`);
      console.log(`🔗 Callback URL: ${callbackUrl}`);
      
      // Check for specific error content on page
      const pageContent = await page.textContent('body');
      if (pageContent.includes('callback') || pageContent.includes('error')) {
        console.log('📄 Page contains error information');
      }
    }
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'callback_debug_result.png', fullPage: true });
    console.log('📸 Screenshot saved as callback_debug_result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'callback_debug_error.png', fullPage: true });
  }
  
  console.log('🔍 Keeping browser open for inspection...');
  await page.waitForTimeout(60000); // 1 minute for inspection
  
  await browser.close();
})();