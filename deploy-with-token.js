#!/usr/bin/env node

/**
 * Vercel Deployment Script with API Token
 * 
 * Usage: 
 * node deploy-with-token.js YOUR_VERCEL_TOKEN
 * 
 * Or set environment variable:
 * VERCEL_TOKEN=your_token node deploy-with-token.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get token from command line argument or environment variable
const token = process.argv[2] || process.env.VERCEL_TOKEN;

if (!token) {
  console.error('❌ Error: No Vercel token provided');
  console.error('Usage: node deploy-with-token.js YOUR_VERCEL_TOKEN');
  console.error('Or set VERCEL_TOKEN environment variable');
  process.exit(1);
}

console.log('🚀 Starting Vercel deployment with API token...');

// Step 1: Create/Update Vercel project
async function createVercelProject() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: 'frontend-auth-system-secure',
      gitRepository: {
        type: 'github',
        repo: 'russelmorris/frontend-auth-system-clean'
      },
      framework: 'nextjs',
      buildCommand: 'npm run build',
      devCommand: 'npm run dev',
      installCommand: 'npm install',
      environmentVariables: [
        {
          key: 'NODE_ENV',
          value: 'production',
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        },
        {
          key: 'NEXTAUTH_URL',
          value: 'https://frontend-auth-system-secure.vercel.app',
          type: 'encrypted',
          target: ['production', 'preview']
        }
      ]
    });

    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: '/v9/projects',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Vercel project created/updated successfully');
            console.log(`   Project ID: ${response.id}`);
            console.log(`   URL: https://${response.name}.vercel.app`);
            resolve(response);
          } else if (res.statusCode === 409) {
            console.log('⚠️  Project already exists, continuing with deployment...');
            resolve({ name: 'frontend-auth-system-secure' });
          } else {
            console.error('❌ Error creating project:', response);
            reject(new Error(`API Error: ${res.statusCode}`));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Step 2: Deploy to Vercel
async function deployToVercel() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      name: 'frontend-auth-system-secure',
      gitSource: {
        type: 'github',
        repo: 'russelmorris/frontend-auth-system-clean',
        ref: 'master'
      },
      projectSettings: {
        framework: 'nextjs',
        buildCommand: 'npm run build',
        devCommand: 'npm run dev',
        installCommand: 'npm install'
      },
      target: 'production'
    });

    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: '/v13/deployments',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ Deployment initiated successfully');
            console.log(`   Deployment ID: ${response.id}`);
            console.log(`   URL: ${response.url}`);
            console.log(`   Status: ${response.readyState}`);
            resolve(response);
          } else {
            console.error('❌ Error deploying:', response);
            reject(new Error(`Deployment Error: ${res.statusCode}`));
          }
        } catch (error) {
          console.error('❌ Error parsing deployment response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Deployment request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Step 3: Check deployment status
async function checkDeploymentStatus(deploymentId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v13/deployments/${deploymentId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`📊 Deployment Status: ${response.readyState}`);
          if (response.readyState === 'READY') {
            console.log(`🎉 Deployment successful! Visit: https://${response.url}`);
          } else if (response.readyState === 'ERROR') {
            console.log(`❌ Deployment failed: ${response.error?.message || 'Unknown error'}`);
          }
          resolve(response);
        } catch (error) {
          console.error('❌ Error checking status:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Status check error:', error);
      reject(error);
    });

    req.end();
  });
}

// Main deployment process
async function main() {
  try {
    console.log('1️⃣ Creating/updating Vercel project...');
    const project = await createVercelProject();
    
    console.log('2️⃣ Initiating deployment...');
    const deployment = await deployToVercel();
    
    console.log('3️⃣ Checking deployment status...');
    setTimeout(async () => {
      await checkDeploymentStatus(deployment.id);
    }, 5000); // Wait 5 seconds before checking
    
    console.log('🔧 Next Steps:');
    console.log('1. Set environment variables in Vercel dashboard');
    console.log('2. Configure OAuth providers (Google/Microsoft)');
    console.log('3. Set up database connection');
    console.log('4. Test authentication flow');
    
    console.log('\n📋 Required Environment Variables:');
    console.log('- NEXTAUTH_SECRET');
    console.log('- GOOGLE_CLIENT_ID');  
    console.log('- GOOGLE_CLIENT_SECRET');
    console.log('- DATABASE_URL');
    console.log('- WEAVIATE_URL');
    console.log('- WEAVIATE_API_KEY');
    console.log('- OPENAI_API_KEY');
    
  } catch (error) {
    console.error('💥 Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the deployment
main();