const { chromium } = require('playwright');

(async () => {
  console.log('🔍 COMPREHENSIVE AUTHENTICATION DEBUG');
  console.log('=====================================');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000,
    devtools: true
  });
  
  const context = await browser.newContext({
    // Enable detailed logging
    recordVideo: { dir: './debug-videos/' },
  });
  
  const page = await context.newPage();
  
  // Comprehensive request/response logging
  const networkLogs = [];
  page.on('request', request => {
    networkLogs.push({
      type: 'REQUEST',
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: new Date().toISOString()
    });
    
    if (request.url().includes('localhost:3010') || request.url().includes('auth')) {
      console.log(`📤 ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    
    networkLogs.push({
      type: 'RESPONSE',
      url: url,
      status: status,
      headers: response.headers(),
      timestamp: new Date().toISOString()
    });
    
    if (url.includes('localhost:3010') || url.includes('auth') || url.includes('callback')) {
      console.log(`📥 ${status} ${url}`);
      
      // Log detailed callback responses
      if (url.includes('callback')) {
        try {
          const text = await response.text();
          console.log(`🔍 CALLBACK RESPONSE BODY: ${text.substring(0, 200)}...`);
        } catch (e) {
          console.log(`🔍 CALLBACK RESPONSE: Could not read body`);
        }
      }
      
      if (status >= 300 && status < 400) {
        console.log(`🔄 REDIRECT to: ${response.headers()['location'] || 'unknown'}`);
      }
      
      if (status >= 400) {
        console.log(`❌ ERROR ${status}: ${url}`);
      }
    }
  });
  
  // Console message logging
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({
      type: msg.type(),
      text: text,
      timestamp: new Date().toISOString()
    });
    
    if (msg.type() === 'error' || text.includes('error') || text.includes('Error')) {
      console.log(`🔴 CONSOLE ERROR: ${text}`);
    } else if (text.includes('next-auth') || text.includes('auth')) {
      console.log(`🟡 AUTH LOG: ${text}`);
    }
  });
  
  // Page errors
  page.on('pageerror', error => {
    console.log(`🔴 PAGE EXCEPTION: ${error.message}`);
  });
  
  try {
    console.log('\n🚀 STEP 1: Navigate to sign-in page');
    await page.goto('http://localhost:3010/auth/signin');
    await page.waitForTimeout(3000);
    
    // Check current cookies
    const initialCookies = await context.cookies();
    console.log(`🍪 INITIAL COOKIES: ${initialCookies.length} cookies`);
    initialCookies.forEach(cookie => {
      if (cookie.name.includes('auth')) {
        console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
      }
    });
    
    console.log('\n🚀 STEP 2: Click Continue with Microsoft');
    await page.click('button:has-text("Continue with Microsoft")');
    
    // Wait for redirect and capture state
    await page.waitForTimeout(3000);
    
    console.log('\n🚀 STEP 3: Analyze OAuth redirect');
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('microsoftonline.com')) {
      const url = new URL(currentUrl);
      console.log(`🎯 STATE PARAMETER: ${url.searchParams.get('state')}`);
      console.log(`🎯 CLIENT_ID: ${url.searchParams.get('client_id')}`);
      console.log(`🎯 REDIRECT_URI: ${decodeURIComponent(url.searchParams.get('redirect_uri') || 'none')}`);
      
      // Check cookies after redirect
      const authCookies = await context.cookies();
      console.log(`🍪 COOKIES AFTER REDIRECT: ${authCookies.length} cookies`);
      authCookies.forEach(cookie => {
        if (cookie.name.includes('auth') || cookie.name.includes('state')) {
          console.log(`   - ${cookie.name}: domain=${cookie.domain}, path=${cookie.path}, secure=${cookie.secure}`);
          console.log(`     value=${cookie.value.substring(0, 100)}...`);
        }
      });
    }
    
    console.log('\n🚀 STEP 4: Fill in email and proceed');
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('info@consultai.com.au');
      await page.click('input[type="submit"], button[type="submit"]');
      console.log('✅ Email submitted');
      
      await page.waitForTimeout(5000);
      
      // Check for password or other steps
      const passwordInput = await page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        console.log('⚠️  PASSWORD STEP DETECTED - Manual intervention needed');
        console.log('🔍 Waiting 30 seconds for manual authentication...');
        await page.waitForTimeout(30000);
      }
    }
    
    console.log('\n🚀 STEP 5: Monitor for callback');
    
    // Wait for callback or completion
    let finalUrl = '';
    let callbackDetected = false;
    
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      finalUrl = page.url();
      
      // Check if we hit our callback
      if (finalUrl.includes('localhost:3010')) {
        console.log(`🔄 BACK ON OUR DOMAIN: ${finalUrl}`);
        callbackDetected = true;
        break;
      }
      
      if (i === 29) {
        console.log('⏰ TIMEOUT - Authentication did not complete');
      }
    }
    
    console.log('\n📊 FINAL ANALYSIS');
    console.log('==================');
    
    if (callbackDetected) {
      const url = new URL(finalUrl);
      const error = url.searchParams.get('error');
      const callbackUrl = url.searchParams.get('callbackUrl');
      
      if (finalUrl.includes('dashboard')) {
        console.log('🎉 SUCCESS! Authentication completed and redirected to dashboard');
      } else if (finalUrl.includes('signin')) {
        console.log('❌ AUTHENTICATION FAILED - Back on sign-in page');
        console.log(`   Error parameter: ${error}`);
        console.log(`   Callback URL: ${callbackUrl}`);
        
        // Final cookie check
        const finalCookies = await context.cookies();
        console.log(`🍪 FINAL COOKIES: ${finalCookies.length} cookies`);
        finalCookies.forEach(cookie => {
          if (cookie.name.includes('auth')) {
            console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
          }
        });
      }
    }
    
    // Check current session
    try {
      console.log('\n🔍 CHECKING SESSION STATUS');
      const response = await page.goto('http://localhost:3010/api/auth/session');
      const sessionData = await response.json();
      console.log('📋 SESSION DATA:', JSON.stringify(sessionData, null, 2));
    } catch (e) {
      console.log('❌ Could not check session:', e.message);
    }
    
    console.log('\n📝 SAVING DEBUG LOGS');
    const debugData = {
      networkLogs,
      consoleLogs,
      finalUrl,
      timestamp: new Date().toISOString()
    };
    
    require('fs').writeFileSync('./auth-debug-logs.json', JSON.stringify(debugData, null, 2));
    console.log('💾 Debug logs saved to auth-debug-logs.json');
    
  } catch (error) {
    console.error('❌ DEBUG TEST FAILED:', error.message);
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'final-auth-state.png', fullPage: true });
  console.log('📸 Final screenshot saved as final-auth-state.png');
  
  console.log('\n⏳ Keeping browser open for 60 seconds for manual inspection...');
  await page.waitForTimeout(60000);
  
  await browser.close();
  console.log('✅ Debug test completed');
})();