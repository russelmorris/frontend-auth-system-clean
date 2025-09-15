const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Testing redirect URI configuration...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture all requests to see the exact flow
  page.on('request', request => {
    const url = request.url();
    if (url.includes('localhost:3010') || url.includes('microsoft') || url.includes('azure')) {
      console.log(`📤 REQUEST: ${request.method()} ${url}`);
    }
  });
  
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (url.includes('localhost:3010') || url.includes('callback')) {
      console.log(`📥 RESPONSE: ${status} ${url}`);
      
      if (status >= 300 && status < 400) {
        console.log(`🔄 REDIRECT to: ${response.headers()['location'] || 'unknown'}`);
      }
    }
  });
  
  try {
    console.log('1️⃣ Going to sign-in page...');
    await page.goto('http://localhost:3010/auth/signin');
    await page.waitForTimeout(2000);
    
    console.log('2️⃣ Clicking Continue with Microsoft...');
    await page.click('button:has-text("Continue with Microsoft")');
    
    console.log('3️⃣ Waiting for Microsoft OAuth...');
    await page.waitForURL('**/oauth2/**', { timeout: 10000 });
    
    console.log('4️⃣ Current URL:', page.url());
    
    // Extract the redirect_uri from the current URL
    const currentUrl = new URL(page.url());
    const redirectUri = currentUrl.searchParams.get('redirect_uri');
    console.log('🎯 Expected redirect URI:', decodeURIComponent(redirectUri || 'none'));
    
    console.log('5️⃣ Filling email manually...');
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('info@consultai.com.au');
      console.log('6️⃣ Clicking Next...');
      await page.click('input[type="submit"], button[type="submit"]');
      
      console.log('7️⃣ Waiting for callback or next step...');
      // Wait longer to see what happens
      await page.waitForTimeout(10000);
      
      console.log('8️⃣ Final URL:', page.url());
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('🔍 Keeping browser open for manual testing...');
  await page.waitForTimeout(30000);
  
  await browser.close();
})();