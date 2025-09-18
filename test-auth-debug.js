const { Builder, By, until, logging } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

class AuthenticationDebugger {
    constructor() {
        this.driver = null;
        this.testResults = {
            timestamp: new Date().toISOString(),
            steps: [],
            errors: [],
            networkLogs: [],
            consoleErrors: [],
            cookies: [],
            redirectUrls: []
        };
        this.baseUrl = 'http://localhost:3004';
    }

    async setupDriver() {
        console.log('Setting up Chrome driver with debug options...');

        const chromeOptions = new chrome.Options();
        chromeOptions.addArguments('--enable-logging');
        chromeOptions.addArguments('--v=1');
        chromeOptions.addArguments('--disable-web-security');
        chromeOptions.addArguments('--disable-features=VizDisplayCompositor');
        chromeOptions.addArguments('--window-size=1280,720');
        chromeOptions.addArguments('--no-sandbox');
        chromeOptions.addArguments('--disable-dev-shm-usage');

        // Enable browser logging
        const prefs = new logging.Preferences();
        prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
        prefs.setLevel(logging.Type.DRIVER, logging.Level.ALL);
        prefs.setLevel(logging.Type.PERFORMANCE, logging.Level.ALL);

        this.driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(chromeOptions)
            .setLoggingPrefs(prefs)
            .build();

        console.log('Chrome driver setup complete');
    }

    async logStep(step, success = true, details = null) {
        const stepLog = {
            timestamp: new Date().toISOString(),
            step,
            success,
            details,
            currentUrl: await this.driver.getCurrentUrl()
        };

        this.testResults.steps.push(stepLog);
        console.log(`[${success ? 'SUCCESS' : 'FAILURE'}] ${step}`);
        if (details) {
            console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
        }
        console.log(`  Current URL: ${stepLog.currentUrl}`);
    }

    async captureNetworkLogs() {
        try {
            const logs = await this.driver.manage().logs().get(logging.Type.PERFORMANCE);
            const networkEvents = logs
                .map(log => JSON.parse(log.message))
                .filter(log => log.message.method && (
                    log.message.method.startsWith('Network.') ||
                    log.message.method.startsWith('Runtime.')
                ));

            this.testResults.networkLogs.push(...networkEvents);
        } catch (error) {
            console.log('Could not capture network logs:', error.message);
        }
    }

    async captureConsoleErrors() {
        try {
            const logs = await this.driver.manage().logs().get(logging.Type.BROWSER);
            const consoleErrors = logs
                .filter(log => log.level.name === 'SEVERE' || log.level.name === 'WARNING')
                .map(log => ({
                    timestamp: log.timestamp,
                    level: log.level.name,
                    message: log.message
                }));

            this.testResults.consoleErrors.push(...consoleErrors);
        } catch (error) {
            console.log('Could not capture console logs:', error.message);
        }
    }

    async captureCookies() {
        try {
            const cookies = await this.driver.manage().getCookies();
            this.testResults.cookies = cookies.map(cookie => ({
                name: cookie.name,
                value: cookie.value.substring(0, 50) + '...', // Truncate for security
                domain: cookie.domain,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly
            }));
        } catch (error) {
            console.log('Could not capture cookies:', error.message);
        }
    }

    async waitForUrlContains(substring, timeout = 15000) {
        try {
            await this.driver.wait(
                until.urlContains(substring),
                timeout,
                `Timeout waiting for URL to contain: ${substring}`
            );
            return true;
        } catch (error) {
            await this.logStep(`Wait for URL containing "${substring}"`, false, { error: error.message });
            return false;
        }
    }

    async testAuthenticationFlow() {
        console.log('\n=== STARTING AZURE AD AUTHENTICATION DEBUG TEST ===\n');

        try {
            await this.setupDriver();

            // Step 1: Navigate to home page
            await this.driver.get(this.baseUrl);
            await this.logStep('Navigate to home page', true);
            await this.captureNetworkLogs();
            await this.captureConsoleErrors();

            // Step 2: Check if we're redirected to signin
            await this.driver.sleep(2000);
            const currentUrl = await this.driver.getCurrentUrl();

            if (currentUrl.includes('/auth/signin') || currentUrl.includes('/api/auth/signin')) {
                await this.logStep('Automatically redirected to signin page', true);
            } else {
                // Navigate to signin manually
                await this.driver.get(`${this.baseUrl}/auth/signin`);
                await this.logStep('Manually navigate to signin page', true);
            }

            // Step 3: Find and click Microsoft sign-in button
            await this.driver.sleep(2000);
            await this.captureConsoleErrors();

            try {
                // Look for various possible selectors for Microsoft signin button
                const possibleSelectors = [
                    'button[data-provider="azure-ad"]',
                    'button:contains("Microsoft")',
                    'button:contains("Continue with Microsoft")',
                    'a[href*="azure-ad"]',
                    'form[action*="azure-ad"] button',
                    '.auth-button[data-provider="azure-ad"]'
                ];

                let signInButton = null;
                for (const selector of possibleSelectors) {
                    try {
                        if (selector.includes(':contains')) {
                            // Handle text-based selectors
                            const buttons = await this.driver.findElements(By.tagName('button'));
                            for (const button of buttons) {
                                const text = await button.getText();
                                if (text.includes('Microsoft') || text.includes('Continue with Microsoft')) {
                                    signInButton = button;
                                    break;
                                }
                            }
                        } else {
                            signInButton = await this.driver.findElement(By.css(selector));
                        }
                        if (signInButton) break;
                    } catch (e) {
                        // Continue to next selector
                    }
                }

                if (!signInButton) {
                    // Fallback: look for any button or link
                    const pageSource = await this.driver.getPageSource();
                    await this.logStep('Find Microsoft signin button', false, {
                        error: 'Could not find Microsoft signin button',
                        pageSourceSnippet: pageSource.substring(0, 1000)
                    });

                    // Try to find any auth-related links
                    const links = await this.driver.findElements(By.tagName('a'));
                    for (const link of links) {
                        const href = await link.getAttribute('href');
                        if (href && href.includes('auth')) {
                            console.log('Found auth link:', href);
                        }
                    }
                    return;
                }

                // Click the Microsoft sign-in button
                await signInButton.click();
                await this.logStep('Click Microsoft signin button', true);

            } catch (error) {
                await this.logStep('Find and click Microsoft signin button', false, { error: error.message });
                return;
            }

            // Step 4: Wait for redirect to Microsoft
            await this.driver.sleep(3000);
            const afterClickUrl = await this.driver.getCurrentUrl();
            this.testResults.redirectUrls.push(afterClickUrl);

            if (afterClickUrl.includes('login.microsoftonline.com') || afterClickUrl.includes('login.live.com')) {
                await this.logStep('Redirected to Microsoft login', true, { url: afterClickUrl });
            } else {
                await this.logStep('Expected redirect to Microsoft', false, {
                    currentUrl: afterClickUrl,
                    expected: 'login.microsoftonline.com or login.live.com'
                });
            }

            // Step 5: Check if we reach Microsoft login form
            await this.driver.sleep(3000);
            await this.captureNetworkLogs();
            await this.captureConsoleErrors();

            try {
                // Look for Microsoft login form elements
                const emailInput = await this.driver.findElement(By.css('input[type="email"], input[name="loginfmt"], input[placeholder*="email"]'));
                await this.logStep('Microsoft login form loaded', true);

                // Enter test email
                await emailInput.sendKeys('info@consultai.com.au');
                await this.logStep('Enter test email', true);

                // Look for and click Next button
                const nextButton = await this.driver.findElement(By.css('input[type="submit"], button[type="submit"], input[value="Next"]'));
                await nextButton.click();
                await this.logStep('Click Next on Microsoft login', true);

            } catch (error) {
                await this.logStep('Interact with Microsoft login form', false, { error: error.message });
            }

            // Step 6: Monitor for redirect back to app
            await this.driver.sleep(5000);

            // Wait and watch for redirects
            for (let i = 0; i < 10; i++) {
                const currentUrl = await this.driver.getCurrentUrl();
                this.testResults.redirectUrls.push(currentUrl);

                console.log(`Redirect check ${i + 1}: ${currentUrl}`);

                if (currentUrl.includes(this.baseUrl)) {
                    if (currentUrl.includes('error')) {
                        await this.logStep('Returned to app with error', false, { url: currentUrl });

                        // Try to extract error information
                        try {
                            const urlParams = new URL(currentUrl).searchParams;
                            const error = urlParams.get('error');
                            const errorDescription = urlParams.get('error_description');

                            await this.logStep('OAuth error details', false, {
                                error,
                                errorDescription,
                                fullUrl: currentUrl
                            });
                        } catch (e) {
                            console.log('Could not parse error URL:', e.message);
                        }
                        break;
                    } else if (currentUrl.includes('dashboard') || !currentUrl.includes('auth')) {
                        await this.logStep('Successfully authenticated and redirected', true, { url: currentUrl });
                        break;
                    }
                }

                await this.driver.sleep(2000);
            }

        } catch (error) {
            this.testResults.errors.push({
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack
            });
            console.error('Test execution error:', error);
        } finally {
            await this.captureNetworkLogs();
            await this.captureConsoleErrors();
            await this.captureCookies();
            await this.generateReport();

            if (this.driver) {
                await this.driver.quit();
            }
        }
    }

    async generateReport() {
        const reportData = {
            ...this.testResults,
            summary: {
                totalSteps: this.testResults.steps.length,
                successfulSteps: this.testResults.steps.filter(s => s.success).length,
                failedSteps: this.testResults.steps.filter(s => !s.success).length,
                totalErrors: this.testResults.errors.length,
                consoleErrors: this.testResults.consoleErrors.length,
                redirectUrls: [...new Set(this.testResults.redirectUrls)] // Remove duplicates
            }
        };

        const reportPath = path.join(__dirname, 'auth-debug-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

        console.log('\n=== AUTHENTICATION DEBUG REPORT ===');
        console.log(`Report saved to: ${reportPath}`);
        console.log(`Total steps: ${reportData.summary.totalSteps}`);
        console.log(`Successful: ${reportData.summary.successfulSteps}`);
        console.log(`Failed: ${reportData.summary.failedSteps}`);
        console.log(`Errors: ${reportData.summary.totalErrors}`);
        console.log(`Console errors: ${reportData.summary.consoleErrors}`);
        console.log(`Unique redirect URLs: ${reportData.summary.redirectUrls.length}`);

        // Print failed steps
        const failedSteps = this.testResults.steps.filter(s => !s.success);
        if (failedSteps.length > 0) {
            console.log('\n=== FAILED STEPS ===');
            failedSteps.forEach(step => {
                console.log(`- ${step.step}: ${step.details?.error || 'Unknown error'}`);
            });
        }

        // Print redirect chain
        if (reportData.summary.redirectUrls.length > 0) {
            console.log('\n=== REDIRECT CHAIN ===');
            reportData.summary.redirectUrls.forEach((url, index) => {
                console.log(`${index + 1}. ${url}`);
            });
        }

        return reportData;
    }

    // Method to test just the initial OAuth request
    async testOAuthInitiation() {
        console.log('\n=== TESTING OAUTH INITIATION ONLY ===\n');

        try {
            await this.setupDriver();

            // Navigate directly to OAuth initiation
            const oauthUrl = `${this.baseUrl}/api/auth/signin/azure-ad`;
            await this.driver.get(oauthUrl);
            await this.logStep('Navigate directly to OAuth initiation URL', true);

            await this.driver.sleep(5000);

            const finalUrl = await this.driver.getCurrentUrl();
            this.testResults.redirectUrls.push(finalUrl);

            if (finalUrl.includes('login.microsoftonline.com')) {
                await this.logStep('OAuth initiation successful - redirected to Microsoft', true, { url: finalUrl });
            } else {
                await this.logStep('OAuth initiation failed', false, { finalUrl });
            }

        } catch (error) {
            console.error('OAuth initiation test error:', error);
        } finally {
            await this.generateReport();
            if (this.driver) {
                await this.driver.quit();
            }
        }
    }
}

// Export for use in other scripts
module.exports = AuthenticationDebugger;

// Run tests if this file is executed directly
if (require.main === module) {
    const authDebugger = new AuthenticationDebugger();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const testType = args[0] || 'full';

    if (testType === 'oauth-only') {
        authDebugger.testOAuthInitiation();
    } else {
        authDebugger.testAuthenticationFlow();
    }
}