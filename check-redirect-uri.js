require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function checkRedirectUri() {
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new chrome.Options().addArguments('--disable-blink-features=AutomationControlled'))
        .build();

    try {
        console.log('\n=== Checking Redirect URI ===\n');

        // Open sign-in page
        const authUrl = 'http://localhost:3010/auth/signin';
        console.log('1. Opening sign-in page:', authUrl);
        await driver.get(authUrl);
        await driver.sleep(2000);

        // Click Personal Account button
        console.log('\n2. Clicking Personal Microsoft Account button...');
        const personalButton = await driver.findElement(By.xpath("//button[contains(., 'Personal Microsoft Account')]"));
        await personalButton.click();
        await driver.sleep(2000);

        // Get the redirect URL
        const currentUrl = await driver.getCurrentUrl();
        console.log('\n3. Full OAuth URL:');
        console.log(currentUrl);

        // Parse the URL to extract redirect_uri
        const url = new URL(currentUrl);
        const redirectUri = url.searchParams.get('redirect_uri');

        console.log('\n4. Redirect URI being used:');
        console.log('   ' + decodeURIComponent(redirectUri));

        console.log('\n5. REQUIRED ACTION:');
        console.log('   You need to add this EXACT redirect URI in Azure Portal:');
        console.log('   ' + decodeURIComponent(redirectUri));

        console.log('\n6. Steps to fix:');
        console.log('   1. Go to Azure Portal > App registrations > front-end-2');
        console.log('   2. Click on "Authentication" in the left menu');
        console.log('   3. Under "Web" platform, add this redirect URI:');
        console.log('      ' + decodeURIComponent(redirectUri));
        console.log('   4. Click "Save"');
        console.log('   5. Try signing in again');

        // Keep browser open
        console.log('\nKeeping browser open for 10 seconds...');
        await driver.sleep(10000);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await driver.quit();
    }
}

checkRedirectUri().catch(console.error);