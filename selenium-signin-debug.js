const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

async function debugSignIn() {
    console.log('\n=== Direct Sign-In Page Debug ===\n');

    const options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--start-maximized');
    options.excludeSwitches(['enable-automation']);

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // Navigate directly to sign-in page
        console.log('Navigating directly to sign-in page...');
        await driver.get('http://localhost:3200/api/auth/signin');
        await driver.sleep(3000);

        // Take screenshot
        const signinScreenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('debug-signin-page.png', signinScreenshot, 'base64');
        console.log('Screenshot saved: debug-signin-page.png');

        // Look for Microsoft sign-in button
        console.log('\nLooking for Microsoft/Azure AD sign-in option...');

        try {
            // Common selectors for OAuth provider buttons
            const providerSelectors = [
                By.xpath("//button[contains(text(), 'Microsoft')]"),
                By.xpath("//button[contains(text(), 'Azure')]"),
                By.xpath("//button[contains(text(), 'Sign in with Microsoft')]"),
                By.css('button[data-provider="azure-ad"]'),
                By.css('button[value="azure-ad"]'),
                By.xpath("//form[@action='/api/auth/signin/azure-ad']//button"),
                By.css('form button')
            ];

            let signInButton = null;
            for (const selector of providerSelectors) {
                try {
                    const elements = await driver.findElements(selector);
                    if (elements.length > 0) {
                        signInButton = elements[0];
                        const buttonText = await signInButton.getText();
                        console.log(`Found button: "${buttonText}"`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (signInButton) {
                console.log('Clicking Microsoft sign-in button...');
                await signInButton.click();
                await driver.sleep(5000);

                // Check where we are now
                const currentUrl = await driver.getCurrentUrl();
                console.log('\nAfter clicking, current URL:', currentUrl);

                // Take screenshot after click
                const afterClickScreenshot = await driver.takeScreenshot();
                require('fs').writeFileSync('debug-after-signin-click.png', afterClickScreenshot, 'base64');
                console.log('Screenshot saved: debug-after-signin-click.png');

                // Check for Microsoft login page
                if (currentUrl.includes('login.microsoftonline.com')) {
                    console.log('\n✓ Successfully redirected to Microsoft login!');

                    // Extract tenant info
                    const urlParts = currentUrl.split('/');
                    const tenantIndex = urlParts.indexOf('login.microsoftonline.com') + 1;
                    if (tenantIndex < urlParts.length) {
                        const tenant = urlParts[tenantIndex];
                        console.log('Tenant in URL:', tenant);

                        if (tenant === 'common') {
                            console.log('→ Using common endpoint (multi-tenant enabled)');
                        } else {
                            console.log('→ Using specific tenant:', tenant);
                        }
                    }

                    // Look for any error messages on Microsoft page
                    await driver.sleep(2000);
                    const pageSource = await driver.getPageSource();

                    if (pageSource.includes('AADSTS')) {
                        console.log('\n⚠ Azure AD Error detected!');
                        const errorMatch = pageSource.match(/AADSTS\d+[^<"]*/);
                        if (errorMatch) {
                            console.log('Error:', errorMatch[0]);
                        }
                    }
                } else {
                    console.log('\n⚠ Not redirected to Microsoft login.');
                    console.log('Still on:', currentUrl);

                    // Check for errors
                    const pageSource = await driver.getPageSource();
                    if (pageSource.includes('error') || pageSource.includes('Error')) {
                        console.log('Page may contain error messages');
                    }
                }
            } else {
                console.log('⚠ No Microsoft sign-in button found!');

                // Log all forms and buttons on the page
                const forms = await driver.findElements(By.css('form'));
                console.log(`\nFound ${forms.length} forms on the page`);

                for (let i = 0; i < forms.length; i++) {
                    const action = await forms[i].getAttribute('action');
                    console.log(`Form ${i} action: ${action}`);

                    const buttons = await forms[i].findElements(By.css('button'));
                    for (let j = 0; j < buttons.length; j++) {
                        const text = await buttons[j].getText();
                        console.log(`  Button: "${text}"`);
                    }
                }
            }
        } catch (error) {
            console.error('Error during sign-in process:', error.message);
        }

        // Check page source for configuration
        console.log('\n=== Checking page configuration ===');
        const pageSource = await driver.getPageSource();

        if (pageSource.includes('azure-ad')) {
            console.log('✓ Azure AD provider is configured');
        } else {
            console.log('⚠ Azure AD provider may not be configured');
        }

    } catch (error) {
        console.error('Debug error:', error.message);
    } finally {
        console.log('\n=== Browser will remain open for 30 seconds ===');
        await driver.sleep(30000);
        await driver.quit();
    }
}

debugSignIn().catch(console.error);