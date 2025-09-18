// Debug script to check Azure AD configuration
const puppeteer = require('puppeteer');
require('dotenv').config();

console.log('\n=== Azure AD Configuration Debug ===');
console.log('Tenant ID:', process.env.AZURE_AD_TENANT_ID);
console.log('Client ID:', process.env.AZURE_AD_CLIENT_ID);
console.log('Client Secret:', process.env.AZURE_AD_CLIENT_SECRET ? '***hidden***' : 'NOT SET');
console.log('NextAuth URL:', process.env.NEXTAUTH_URL);

async function debugAuth() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Enable request interception to log all network requests
    await page.setRequestInterception(true);

    page.on('request', (request) => {
        const url = request.url();
        if (url.includes('microsoft') || url.includes('azure') || url.includes('auth')) {
            console.log('\n[REQUEST]', request.method(), url);

            // Parse and log the authorization URL to see which tenant is being used
            if (url.includes('login.microsoftonline.com')) {
                const urlParts = url.split('/');
                const tenantIndex = urlParts.indexOf('login.microsoftonline.com') + 1;
                if (tenantIndex < urlParts.length) {
                    console.log('[TENANT IN URL]:', urlParts[tenantIndex]);
                }
            }
        }
        request.continue();
    });

    page.on('response', (response) => {
        const url = response.url();
        if (url.includes('error') || response.status() >= 400) {
            console.log('[ERROR RESPONSE]', response.status(), url);
        }
    });

    try {
        console.log('\nNavigating to http://localhost:3007...');
        await page.goto('http://localhost:3007', { waitUntil: 'networkidle2' });

        // Wait for and click the sign-in button
        console.log('Looking for sign-in button...');
        await page.waitForSelector('button, a[href*="signin"], a[href*="auth"]', { timeout: 5000 });

        // Take a screenshot before clicking
        await page.screenshot({ path: 'debug-before-signin.png' });

        // Click the sign-in element
        const signInElement = await page.$('button, a[href*="signin"], a[href*="auth"]');
        if (signInElement) {
            console.log('Clicking sign-in...');
            await signInElement.click();

            // Wait for navigation
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

            // Take a screenshot of the auth page
            await page.screenshot({ path: 'debug-auth-page.png' });

            console.log('\nCurrent URL:', page.url());

            // Extract error details if present
            const errorText = await page.evaluate(() => {
                const errorElement = document.querySelector('[class*="error"], [id*="error"]');
                return errorElement ? errorElement.textContent : null;
            });

            if (errorText) {
                console.log('\nError found on page:', errorText);
            }
        }

    } catch (error) {
        console.error('Debug error:', error.message);
    }

    console.log('\nBrowser will remain open for inspection. Press Ctrl+C to exit.');
    // Keep browser open for manual inspection
}

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
    debugAuth();
} catch (e) {
    console.log('\nPuppeteer not installed. Installing...');
    const { execSync } = require('child_process');
    execSync('npm install puppeteer', { stdio: 'inherit' });
    console.log('Puppeteer installed. Please run this script again.');
}