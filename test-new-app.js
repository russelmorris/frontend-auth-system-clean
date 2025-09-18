require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testNewAppRegistration() {
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().addArguments('--disable-blink-features=AutomationControlled'))
        .build();

    try {
        console.log('\n=== Testing New App Registration (front-end-2) ===\n');
        console.log('App ID: 65d76e79-bc39-4f21-89cd-cf9f6a49401b');
        console.log('App Name: front-end-2');

        // Open custom sign-in page
        const authUrl = 'http://localhost:3010/auth/signin';
        console.log('\n1. Opening sign-in page:', authUrl);
        await driver.get(authUrl);
        await driver.sleep(3000);

        // Test Work/School Account
        console.log('\n2. Testing Work/School Account:');
        const workButton = await driver.findElement(By.xpath("//button[contains(., 'Work or School Account')]"));
        console.log('   ✓ Found Work/School Account button');
        await workButton.click();
        await driver.sleep(3000);

        const workUrl = await driver.getCurrentUrl();
        console.log('   Redirected to:', workUrl.substring(0, 100) + '...');

        if (workUrl.includes('organizations')) {
            console.log('   ✓ Using organizations endpoint correctly');
        }

        // Check for errors with work accounts
        const workError = await driver.findElements(By.xpath("//*[contains(text(), 'error')]"));
        if (workError.length === 0) {
            console.log('   ✓ No errors detected for work accounts');
        } else {
            console.log('   ✗ Error detected for work accounts');
        }

        // Go back to test personal accounts
        await driver.get(authUrl);
        await driver.sleep(3000);

        // Test Personal Account
        console.log('\n3. Testing Personal Microsoft Account:');
        const personalButton = await driver.findElement(By.xpath("//button[contains(., 'Personal Microsoft Account')]"));
        console.log('   ✓ Found Personal Account button');
        await personalButton.click();
        await driver.sleep(3000);

        const personalUrl = await driver.getCurrentUrl();
        console.log('   Redirected to:', personalUrl.substring(0, 100) + '...');

        if (personalUrl.includes('consumers') || personalUrl.includes('live.com')) {
            console.log('   ✓ Using consumers/live endpoint correctly');
        }

        // Check for unauthorized_client error
        const personalError = await driver.findElements(By.xpath("//*[contains(text(), 'unauthorized_client')]"));
        if (personalError.length === 0) {
            console.log('   ✓ SUCCESS! No unauthorized_client error!');
            console.log('   ✓ Personal accounts should now work with the new app registration');
        } else {
            console.log('   ✗ Still getting unauthorized_client error');
            console.log('   This app may need additional configuration in Azure Portal');
        }

        console.log('\n4. SUMMARY:');
        console.log('   New app registration (front-end-2) is now configured');
        console.log('   CLIENT_ID: 65d76e79-bc39-4f21-89cd-cf9f6a49401b');
        console.log('   Both work and personal accounts should authenticate');

        console.log('\n5. IMPORTANT NEXT STEPS:');
        console.log('   1. In Azure Portal, ensure redirect URIs are registered:');
        console.log('      - http://localhost:3010/api/auth/callback/azure-ad-work');
        console.log('      - http://localhost:3010/api/auth/callback/azure-ad-personal');
        console.log('   2. Verify "Supported account types" is set to:');
        console.log('      "Accounts in any organizational directory and personal Microsoft accounts"');

        // Keep browser open for manual testing
        console.log('\nKeeping browser open for 20 seconds for manual testing...');
        console.log('Try logging in with both account types to verify everything works!');
        await driver.sleep(20000);

    } catch (error) {
        console.error('Error during test:', error.message);
    } finally {
        await driver.quit();
    }
}

testNewAppRegistration().catch(console.error);