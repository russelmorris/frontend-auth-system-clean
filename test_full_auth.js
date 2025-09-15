const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting comprehensive authentication test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for all network requests
  page.on('response', response => {
    const url = response.url();
    if (url.includes('auth') || url.includes('callback') || url.includes('error')) {
      console.log(`📡 ${response.status()} ${url}`);
    }
  });
  
  // Listen for console logs
  page.on('console', msg => {
    if (msg.text().includes('Sign in attempt') || msg.text().includes('error')) {
      console.log('🔍 PAGE LOG:', msg.text());
    }
  });
  
  try {
    console.log('1️⃣ Navigating to fresh sign-in page...');
    await page.goto('http://localhost:3010/auth/signin');
    await page.waitForTimeout(2000);
    
    console.log('2️⃣ Clicking Continue with Microsoft...');
    await page.click('button:has-text("Continue with Microsoft")');
    
    console.log('3️⃣ Waiting for Microsoft account selection...');
    await page.waitForURL('**/oauth2/**', { timeout: 15000 });
    
    // Check if we see the account picker
    try {
      await page.waitForSelector('div[data-test-id="accountList"]', { timeout: 5000 });
      console.log('✅ Account selection screen appeared!');
      
      // Look for the consultai.com.au account
      const consultaiAccount = await page.locator('text=info@consultai.com.au').first();
      if (await consultaiAccount.isVisible()) {
        console.log('4️⃣ Clicking info@consultai.com.au account...');
        await consultaiAccount.click();
      } else {
        console.log('❌ consultai account not found, looking for other accounts...');
        const accounts = await page.locator('[data-test-id="account-tile"]').all();
        console.log(`Found ${accounts.length} accounts`);
        if (accounts.length > 0) {
          console.log('4️⃣ Clicking first available account...');
          await accounts[0].click();
        }
      }
    } catch (error) {
      console.log('⚠️ Account selector not found, looking for other login elements...');
      
      // Try alternative selectors
      const emailInput = await page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        console.log('4️⃣ Found email input, typing email...');
        await emailInput.fill('info@consultai.com.au');
        await page.click('button[type="submit"], input[type="submit"]');
      }
    }
    
    console.log('5️⃣ Waiting for callback processing...');
    await page.waitForTimeout(5000);
    
    // Check if we're back on our domain
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('localhost:3010')) {
      if (currentUrl.includes('dashboard')) {
        console.log('🎉 SUCCESS! Authentication completed - redirected to dashboard!');
      } else if (currentUrl.includes('signin')) {
        console.log('🔄 Still on sign-in page - authentication loop detected');
        
        // Check for error parameters
        const url = new URL(currentUrl);
        const error = url.searchParams.get('error');
        if (error) {
          console.log(`❌ Error parameter found: ${error}`);
        }
      } else {
        console.log(`🤔 Unexpected page: ${currentUrl}`);
      }
    } else {
      console.log('🔄 Still on Microsoft domain, waiting longer...');
      await page.waitForTimeout(10000);
      console.log(`📍 Final URL: ${page.url()}`);
    }
    
    // Take a screenshot for inspection
    await page.screenshot({ path: 'auth_test_result.png', fullPage: true });
    console.log('📸 Screenshot saved as auth_test_result.png');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'auth_test_error.png', fullPage: true });
  }
  
  console.log('🔍 Keeping browser open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();