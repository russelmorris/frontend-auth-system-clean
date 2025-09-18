const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

async function debugAuth() {
    console.log('\n=== Starting Selenium Authentication Debug ===\n');

    // Log current configuration
    console.log('Current Configuration:');
    console.log('- Tenant ID:', process.env.AZURE_AD_TENANT_ID);
    console.log('- Client ID:', process.env.AZURE_AD_CLIENT_ID);
    console.log('- App URL: http://localhost:3200\n');

    // Set up Chrome with debugging options
    const options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--start-maximized');
    options.excludeSwitches(['enable-automation']);
    options.setUserPreferences({ 'credentials_enable_service': false });

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // Step 1: Navigate to the app
        console.log('Step 1: Navigating to http://localhost:3200...');
        await driver.get('http://localhost:3200');
        await driver.sleep(2000);

        // Take screenshot of landing page
        const landingScreenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('debug-1-landing.png', landingScreenshot, 'base64');
        console.log('Screenshot saved: debug-1-landing.png');

        // Step 2: Find and click sign in button
        console.log('\nStep 2: Looking for sign-in button...');
        try {
            // Try different selectors
            const signInSelectors = [
                By.xpath("//button[contains(text(), 'Sign')]"),
                By.xpath("//a[contains(text(), 'Sign')]"),
                By.xpath("//button[contains(text(), 'Login')]"),
                By.xpath("//a[contains(text(), 'Login')]"),
                By.css('button'),
                By.css('a[href*="signin"]'),
                By.css('a[href*="auth"]')
            ];

            let signInElement = null;
            for (const selector of signInSelectors) {
                try {
                    signInElement = await driver.findElement(selector);
                    if (signInElement) {
                        console.log('Found sign-in element with selector:', selector.toString());
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!signInElement) {
                console.log('ERROR: No sign-in button found!');

                // Log all buttons and links on the page for debugging
                const buttons = await driver.findElements(By.css('button'));
                const links = await driver.findElements(By.css('a'));

                console.log('\nFound buttons:', buttons.length);
                for (let i = 0; i < Math.min(5, buttons.length); i++) {
                    const text = await buttons[i].getText();
                    console.log(`  Button ${i}: "${text}"`);
                }

                console.log('\nFound links:', links.length);
                for (let i = 0; i < Math.min(5, links.length); i++) {
                    const text = await links[i].getText();
                    const href = await links[i].getAttribute('href');
                    console.log(`  Link ${i}: "${text}" -> ${href}`);
                }

                return;
            }

            console.log('Clicking sign-in button...');
            await signInElement.click();
            await driver.sleep(3000);

            // Step 3: Check if we're redirected to Microsoft login
            console.log('\nStep 3: Checking redirect...');
            const currentUrl = await driver.getCurrentUrl();
            console.log('Current URL:', currentUrl);

            // Take screenshot after clicking sign in
            const authScreenshot = await driver.takeScreenshot();
            require('fs').writeFileSync('debug-2-after-signin.png', authScreenshot, 'base64');
            console.log('Screenshot saved: debug-2-after-signin.png');

            // Step 4: Check for Microsoft login page
            if (currentUrl.includes('login.microsoftonline.com')) {
                console.log('\n✓ Successfully redirected to Microsoft login!');

                // Extract tenant from URL
                const urlMatch = currentUrl.match(/login\.microsoftonline\.com\/([^\/]+)/);
                if (urlMatch) {
                    console.log('Tenant in URL:', urlMatch[1]);

                    if (urlMatch[1] === 'common') {
                        console.log('  → Using common endpoint (multi-tenant)');
                    } else if (urlMatch[1] === process.env.AZURE_AD_TENANT_ID) {
                        console.log('  → Using correct tenant ID');
                    } else {
                        console.log('  ⚠ WARNING: Different tenant in URL!');
                    }
                }

                // Check for error messages
                try {
                    const errorElement = await driver.findElement(By.css('[class*="error"], #error, .alert'));
                    const errorText = await errorElement.getText();
                    console.log('\n⚠ Error found on Microsoft login page:', errorText);
                } catch (e) {
                    console.log('\n✓ No errors on Microsoft login page');
                }

            } else if (currentUrl.includes('localhost')) {
                console.log('\n⚠ Still on localhost. Checking for errors...');

                // Look for error messages
                try {
                    const pageSource = await driver.getPageSource();

                    if (pageSource.includes('AADSTS')) {
                        const errorMatch = pageSource.match(/AADSTS\d+[^<]*/);
                        if (errorMatch) {
                            console.log('\n❌ Azure AD Error Found:', errorMatch[0]);
                        }
                    }

                    // Try to find any error text
                    const errorElements = await driver.findElements(By.xpath("//*[contains(text(), 'error') or contains(text(), 'Error')]"));
                    for (const elem of errorElements) {
                        const text = await elem.getText();
                        if (text && text.length > 0) {
                            console.log('Error text found:', text);
                        }
                    }
                } catch (e) {
                    console.log('No error elements found');
                }
            }

            // Step 5: Log console errors
            console.log('\nStep 5: Checking browser console for errors...');
            const logs = await driver.manage().logs().get('browser');
            const errors = logs.filter(log => log.level.name === 'SEVERE');
            if (errors.length > 0) {
                console.log('Browser console errors:');
                errors.forEach(error => {
                    console.log('  -', error.message);
                });
            } else {
                console.log('No console errors found');
            }

        } catch (error) {
            console.error('\n❌ Debug error:', error.message);

            // Take error screenshot
            try {
                const errorScreenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('debug-error.png', errorScreenshot, 'base64');
                console.log('Error screenshot saved: debug-error.png');
            } catch (e) {}
        }

    } finally {
        console.log('\n=== Debug Session Complete ===');
        console.log('Browser will remain open for 30 seconds for manual inspection...');
        await driver.sleep(30000);
        await driver.quit();
    }
}

// Run the debug
debugAuth().catch(console.error);