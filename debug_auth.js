const { chromium } = require('playwright');

(async () => {
  console.log('Starting authentication debug...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for all network requests
  page.on('response', response => {
    console.log(`${response.status()} ${response.url()}`);
  });
  
  // Listen for console logs from the page
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  try {
    console.log('1. Navigating to sign-in page...');
    await page.goto('http://localhost:3007/auth/signin');
    
    console.log('2. Waiting for Continue with Microsoft button...');
    await page.waitForSelector('button', { timeout: 5000 });
    
    console.log('3. Clicking Continue with Microsoft...');
    await page.click('button');
    
    console.log('4. Waiting for Microsoft login page...');
    await page.waitForURL('**/oauth2/**', { timeout: 10000 });
    
    console.log('5. Checking if account selection appears...');
    // Wait a bit to see what happens
    await page.waitForTimeout(3000);
    
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // Check for error messages
    const errorText = await page.textContent('body').catch(() => 'No body text');
    if (errorText.includes('error') || errorText.includes('Error')) {
      console.log('ERROR DETECTED:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('Debug error:', error.message);
  }
  
  console.log('Keeping browser open for manual inspection...');
  // Keep browser open for manual debugging
  await page.waitForTimeout(30000);
  
  await browser.close();
})();