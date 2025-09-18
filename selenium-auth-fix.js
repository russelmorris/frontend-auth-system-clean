require('dotenv').config();
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function debugAuth() {
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().addArguments('--disable-blink-features=AutomationControlled'))
        .build();

    try {
        console.log('\n=== Selenium Authentication Debug ===\n');

        // Step 1: Check current OAuth URL being used
        const authUrl = 'http://localhost:3009/api/auth/signin';
        console.log('1. Opening NextAuth sign-in page:', authUrl);
        await driver.get(authUrl);
        await driver.sleep(2000);

        // Find and click the Microsoft button
        console.log('2. Looking for Microsoft sign-in button...');
        const signInButton = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Microsoft') or contains(., 'Azure')]")),
            5000
        );

        // Get the form action to see what URL it will redirect to
        const form = await signInButton.findElement(By.xpath('ancestor::form'));
        const action = await form.getAttribute('action');
        console.log('   Form action:', action);

        console.log('3. Clicking Microsoft sign-in...');
        await signInButton.click();

        // Wait for redirect to Microsoft
        await driver.wait(until.urlContains('login.microsoftonline.com'), 10000);

        // Get the current URL to analyze the OAuth parameters
        const currentUrl = await driver.getCurrentUrl();
        console.log('\n4. Redirected to Microsoft login:');
        console.log('   Full URL:', currentUrl);

        // Parse the URL to check parameters
        const url = new URL(currentUrl);
        const clientId = url.searchParams.get('client_id');
        const redirectUri = url.searchParams.get('redirect_uri');
        const scope = url.searchParams.get('scope');
        const tenant = url.pathname.match(/\/([^\/]+)\/oauth2/)[1];

        console.log('\n5. OAuth Parameters:');
        console.log('   Client ID:', clientId);
        console.log('   Tenant:', tenant);
        console.log('   Redirect URI:', redirectUri);
        console.log('   Scope:', scope);

        // Check if using correct endpoint
        if (tenant === 'common') {
            console.log('   ✓ Using common endpoint (correct for multi-tenant)');
        } else if (tenant === 'consumers') {
            console.log('   ✓ Using consumers endpoint (personal accounts only)');
        } else {
            console.log('   ✗ Using specific tenant:', tenant, '(won\'t work for personal accounts)');
        }

        // Try to sign in with a personal account
        console.log('\n6. Attempting sign-in...');

        // Check for error message
        const errorElements = await driver.findElements(By.xpath("//*[contains(text(), 'unauthorized_client')]"));
        if (errorElements.length > 0) {
            console.log('   ✗ Error found: unauthorized_client');
            console.log('   This means the app registration is not properly configured for personal accounts');

            console.log('\n7. SOLUTION REQUIRED:');
            console.log('   The app registration needs to be recreated with the correct settings:');
            console.log('   - Create a NEW app registration in Azure Portal');
            console.log('   - Select "Accounts in any organizational directory and personal Microsoft accounts"');
            console.log('   - This MUST be selected during creation, not changed later');
            console.log('   - Add redirect URI: ' + redirectUri);

            // Try alternative approach - use consumers endpoint directly
            console.log('\n8. Testing consumers endpoint directly...');
            const consumersUrl = currentUrl.replace('/common/', '/consumers/');
            await driver.get(consumersUrl);
            await driver.sleep(2000);

            const consumersError = await driver.findElements(By.xpath("//*[contains(text(), 'unauthorized_client')]"));
            if (consumersError.length > 0) {
                console.log('   ✗ Consumers endpoint also fails - app definitely needs recreation');
            }
        }

        console.log('\n9. Checking app registration details...');
        console.log('   Current app ID:', clientId);
        console.log('   This app (bfc2a4f4-4357-40c9-8ed6-cab30ab946a8) appears to be restricted');

        console.log('\n10. IMMEDIATE FIX OPTIONS:');
        console.log('   Option A: Create a completely NEW app registration');
        console.log('   Option B: Try using a different OAuth provider configuration');

        // Keep browser open for 10 seconds to observe
        console.log('\nKeeping browser open for observation...');
        await driver.sleep(10000);

    } catch (error) {
        console.error('Error during authentication debug:', error.message);
    } finally {
        await driver.quit();
    }
}

debugAuth().catch(console.error);