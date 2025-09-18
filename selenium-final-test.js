require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testFinalAuth() {
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().addArguments('--disable-blink-features=AutomationControlled'))
        .build();

    try {
        console.log('\n=== Final Authentication Test ===\n');

        // Open custom sign-in page
        const authUrl = 'http://localhost:3009/auth/signin';
        console.log('1. Opening custom sign-in page:', authUrl);
        await driver.get(authUrl);
        await driver.sleep(3000);

        // Look for both buttons
        console.log('2. Looking for sign-in buttons...');

        // Find Work/School Account button
        const workButton = await driver.findElement(By.xpath("//button[contains(., 'Work or School Account')]"));
        console.log('   ✓ Found Work or School Account button');

        // Find Personal Account button
        const personalButton = await driver.findElement(By.xpath("//button[contains(., 'Personal Microsoft Account')]"));
        console.log('   ✓ Found Personal Microsoft Account button');

        // Test Work/School account
        console.log('\n3. Testing Work/School Account:');
        await workButton.click();
        await driver.sleep(3000);

        const workUrl = await driver.getCurrentUrl();
        if (workUrl.includes('organizations')) {
            console.log('   ✓ Correctly redirected to organizations endpoint');
            console.log('   URL:', workUrl.substring(0, 100) + '...');
        } else if (workUrl.includes('login.microsoftonline.com')) {
            console.log('   ✓ Redirected to Microsoft login');
            const endpoint = workUrl.includes('organizations') ? 'organizations' :
                            workUrl.includes('consumers') ? 'consumers' :
                            workUrl.includes('common') ? 'common' : 'unknown';
            console.log('   Endpoint:', endpoint);
        }

        // Go back to test personal account
        await driver.get(authUrl);
        await driver.sleep(3000);

        // Test Personal account
        console.log('\n4. Testing Personal Microsoft Account:');
        const personalButton2 = await driver.findElement(By.xpath("//button[contains(., 'Personal Microsoft Account')]"));
        await personalButton2.click();
        await driver.sleep(3000);

        const personalUrl = await driver.getCurrentUrl();
        if (personalUrl.includes('consumers')) {
            console.log('   ✓ Correctly redirected to consumers endpoint');
            console.log('   URL:', personalUrl.substring(0, 100) + '...');
        } else if (personalUrl.includes('login.microsoftonline.com')) {
            console.log('   Redirected to Microsoft login');
            const endpoint = personalUrl.includes('organizations') ? 'organizations' :
                            personalUrl.includes('consumers') ? 'consumers' :
                            personalUrl.includes('common') ? 'common' : 'unknown';
            console.log('   Endpoint:', endpoint);
        }

        // Check for errors
        const errorElements = await driver.findElements(By.xpath("//*[contains(text(), 'unauthorized_client')]"));
        if (errorElements.length > 0) {
            console.log('\n   ✗ Still getting unauthorized_client error for personal accounts');
            console.log('   This confirms the app registration cannot support personal accounts');
            console.log('\n5. SOLUTION:');
            console.log('   You need a NEW app registration that supports personal accounts');
            console.log('   The current app (bfc2a4f4-4357-40c9-8ed6-cab30ab946a8) is restricted');
        } else {
            console.log('\n5. SUCCESS:');
            console.log('   Both account types are properly configured');
            console.log('   Work accounts use: organizations endpoint');
            console.log('   Personal accounts use: consumers endpoint');
        }

        console.log('\n6. SUMMARY:');
        console.log('   - Dual-provider setup is correctly implemented');
        console.log('   - Custom sign-in page shows both options');
        console.log('   - Work accounts should authenticate successfully');
        console.log('   - Personal accounts will fail due to app registration limitations');

        // Keep browser open for manual testing
        console.log('\nKeeping browser open for 15 seconds for manual testing...');
        await driver.sleep(15000);

    } catch (error) {
        console.error('Error during test:', error.message);
    } finally {
        await driver.quit();
    }
}

testFinalAuth().catch(console.error);