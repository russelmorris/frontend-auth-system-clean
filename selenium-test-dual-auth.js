require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function testDualAuth() {
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().addArguments('--disable-blink-features=AutomationControlled'))
        .build();

    try {
        console.log('\n=== Testing Dual Provider Authentication ===\n');

        // Open sign-in page
        const authUrl = 'http://localhost:3009/api/auth/signin';
        console.log('1. Opening NextAuth sign-in page:', authUrl);
        await driver.get(authUrl);
        await driver.sleep(2000);

        // Look for both provider buttons
        console.log('2. Looking for provider buttons...');

        const buttons = await driver.findElements(By.xpath("//button[contains(@type, 'submit')]"));
        console.log('   Found', buttons.length, 'sign-in buttons');

        for (let i = 0; i < buttons.length; i++) {
            const text = await buttons[i].getText();
            console.log('   Button', i + 1 + ':', text);
        }

        // Test Work/School account button
        console.log('\n3. Testing Work/School Account provider:');
        const workButton = await driver.findElement(By.xpath("//button[contains(., 'Work') or contains(., 'School')]"));
        if (workButton) {
            console.log('   ✓ Found Work/School Account button');

            // Get the form action
            const form = await workButton.findElement(By.xpath('ancestor::form'));
            const action = await form.getAttribute('action');
            console.log('   Form action:', action);

            // Click and see where it redirects
            await workButton.click();
            await driver.sleep(3000);

            const currentUrl = await driver.getCurrentUrl();
            if (currentUrl.includes('organizations')) {
                console.log('   ✓ Correctly using organizations endpoint');
            } else {
                console.log('   Current URL:', currentUrl);
            }

            // Go back
            await driver.get(authUrl);
            await driver.sleep(2000);
        }

        // Test Personal account button
        console.log('\n4. Testing Personal Microsoft Account provider:');
        const personalButton = await driver.findElement(By.xpath("//button[contains(., 'Personal')]"));
        if (personalButton) {
            console.log('   ✓ Found Personal Microsoft Account button');

            // Get the form action
            const form = await personalButton.findElement(By.xpath('ancestor::form'));
            const action = await form.getAttribute('action');
            console.log('   Form action:', action);

            // Click and see where it redirects
            await personalButton.click();
            await driver.sleep(3000);

            const currentUrl = await driver.getCurrentUrl();
            if (currentUrl.includes('consumers')) {
                console.log('   ✓ Correctly using consumers endpoint');
            } else {
                console.log('   ✗ Not using consumers endpoint');
                console.log('   Current URL:', currentUrl);

                // Check for error
                const errorElements = await driver.findElements(By.xpath("//*[contains(text(), 'unauthorized_client')]"));
                if (errorElements.length > 0) {
                    console.log('   ✗ Still getting unauthorized_client error');
                    console.log('\n   THE PROBLEM: This app registration cannot be used for personal accounts');
                    console.log('   even with the consumers endpoint.');
                }
            }
        }

        console.log('\n5. ANALYSIS:');
        console.log('   The dual-provider approach separates work and personal accounts');
        console.log('   but the fundamental issue remains: the app registration');
        console.log('   (bfc2a4f4-4357-40c9-8ed6-cab30ab946a8) cannot authenticate personal accounts.');

        console.log('\n6. FINAL SOLUTION REQUIRED:');
        console.log('   You need to create a NEW app registration in Azure Portal:');
        console.log('   1. Go to Azure Portal > App registrations');
        console.log('   2. Click "New registration"');
        console.log('   3. IMPORTANT: Select "Accounts in any organizational directory and personal Microsoft accounts"');
        console.log('   4. Add redirect URI: http://localhost:3009/api/auth/callback/azure-ad-work');
        console.log('   5. Add redirect URI: http://localhost:3009/api/auth/callback/azure-ad-personal');
        console.log('   6. Generate a new client secret');
        console.log('   7. Update .env with new CLIENT_ID and CLIENT_SECRET');

        // Keep browser open for observation
        console.log('\nKeeping browser open for 10 seconds...');
        await driver.sleep(10000);

    } catch (error) {
        console.error('Error during test:', error.message);
    } finally {
        await driver.quit();
    }
}

testDualAuth().catch(console.error);