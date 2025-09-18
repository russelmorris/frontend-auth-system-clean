const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

async function patientDebug() {
    console.log('\n=== Patient Selenium Authentication Debug ===\n');
    console.log('Configuration:');
    console.log('- Tenant ID:', process.env.AZURE_AD_TENANT_ID);
    console.log('- Client ID:', process.env.AZURE_AD_CLIENT_ID);
    console.log('- App URL: http://localhost:3200\n');

    const options = new chrome.Options();
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--start-maximized');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // Step 1: Navigate to app
        console.log('Step 1: Navigating to http://localhost:3200');
        await driver.get('http://localhost:3200');

        // Wait for redirect to complete
        console.log('Waiting for page to load and redirect...');
        await driver.sleep(5000); // Give it time to redirect

        let currentUrl = await driver.getCurrentUrl();
        console.log('Current URL after initial load:', currentUrl);

        // If we're on the sign-in page, proceed
        if (currentUrl.includes('/auth/signin') || currentUrl.includes('/api/auth/signin')) {
            console.log('\n✓ Redirected to sign-in page');

            // Take screenshot
            const signinScreenshot = await driver.takeScreenshot();
            require('fs').writeFileSync('debug-signin.png', signinScreenshot, 'base64');
            console.log('Screenshot saved: debug-signin.png');

            // Wait for sign-in button to be present
            console.log('\nStep 2: Waiting for Microsoft sign-in button...');
            await driver.sleep(3000); // Give page time to fully render

            // Find Microsoft sign-in button
            const buttons = await driver.findElements(By.css('button'));
            console.log(`Found ${buttons.length} buttons`);

            let microsoftButton = null;
            for (const button of buttons) {
                try {
                    const text = await button.getText();
                    console.log(`Button text: "${text}"`);
                    if (text.toLowerCase().includes('microsoft') || text.toLowerCase().includes('azure')) {
                        microsoftButton = button;
                        break;
                    }
                } catch (e) {
                    // Button might not be visible
                }
            }

            if (!microsoftButton) {
                // Try finding form with azure-ad action
                const forms = await driver.findElements(By.css('form'));
                for (const form of forms) {
                    const action = await form.getAttribute('action');
                    if (action && action.includes('azure-ad')) {
                        microsoftButton = await form.findElement(By.css('button'));
                        console.log('Found button in form with action:', action);
                        break;
                    }
                }
            }

            if (microsoftButton) {
                console.log('\n✓ Found Microsoft sign-in button, clicking...');
                await microsoftButton.click();

                // Wait patiently for Microsoft redirect
                console.log('\nStep 3: Waiting for redirect to Microsoft (this may take a moment)...');

                // Wait up to 30 seconds for Microsoft login page
                let redirected = false;
                for (let i = 0; i < 30; i++) {
                    await driver.sleep(1000);
                    currentUrl = await driver.getCurrentUrl();

                    if (currentUrl.includes('login.microsoftonline.com')) {
                        redirected = true;
                        break;
                    }

                    if (i % 5 === 0) {
                        console.log(`Waiting... (${i} seconds)`);
                    }
                }

                if (redirected) {
                    console.log('\n✓✓ Successfully redirected to Microsoft login!');
                    console.log('Microsoft URL:', currentUrl);

                    // Extract tenant from URL
                    const tenantMatch = currentUrl.match(/login\.microsoftonline\.com\/([^\/]+)/);
                    if (tenantMatch) {
                        console.log('Tenant in URL:', tenantMatch[1]);
                    }

                    // Take screenshot of Microsoft page
                    await driver.sleep(3000); // Let page fully load
                    const msScreenshot = await driver.takeScreenshot();
                    require('fs').writeFileSync('debug-microsoft-login.png', msScreenshot, 'base64');
                    console.log('Screenshot saved: debug-microsoft-login.png');

                    // Check for errors
                    const pageSource = await driver.getPageSource();
                    if (pageSource.includes('AADSTS')) {
                        console.log('\n⚠ Azure AD Error detected!');
                        const errorMatch = pageSource.match(/AADSTS\d+[^<"]*/);
                        if (errorMatch) {
                            console.log('Error:', errorMatch[0].substring(0, 200));
                        }
                    } else {
                        console.log('\n✓ No Azure AD errors detected');
                        console.log('Ready for user to sign in!');
                    }

                } else {
                    console.log('\n⚠ Did not redirect to Microsoft login after 30 seconds');
                    console.log('Current URL:', await driver.getCurrentUrl());

                    // Check for errors on current page
                    const errorScreenshot = await driver.takeScreenshot();
                    require('fs').writeFileSync('debug-error-page.png', errorScreenshot, 'base64');
                    console.log('Error screenshot saved: debug-error-page.png');
                }
            } else {
                console.log('⚠ No Microsoft sign-in button found');
            }
        } else {
            console.log('\n⚠ Did not redirect to sign-in page');
            console.log('Stayed on:', currentUrl);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        console.log('\n=== Keeping browser open for manual testing ===');
        console.log('You can now manually test the sign-in flow.');
        console.log('Browser will close in 60 seconds...');
        await driver.sleep(60000);
        await driver.quit();
    }
}

patientDebug().catch(console.error);