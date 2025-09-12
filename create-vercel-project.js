const https = require('https');
const fs = require('fs');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN not found in environment variables');
  process.exit(1);
}

async function createVercelProject() {
  try {
    console.log('🚀 Creating Vercel project...');
    
    // Create project payload
    const projectData = JSON.stringify({
      name: 'frontend-auth-system',
      framework: 'nextjs',
      environmentVariables: [
        {
          key: 'AUTH_DATABASE_URL',
          value: process.env.AUTH_DATABASE_URL,
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        },
        {
          key: 'NEXTAUTH_URL',
          value: 'https://frontend-auth-system.vercel.app',
          type: 'plain',
          target: ['production']
        },
        {
          key: 'NEXTAUTH_SECRET',
          value: 'your-super-secret-key-change-in-production-' + Math.random().toString(36).substring(7),
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        },
        {
          key: 'GOOGLE_CLIENT_ID',
          value: 'your-google-client-id',
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        },
        {
          key: 'GOOGLE_CLIENT_SECRET',
          value: 'your-google-client-secret',
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        }
      ]
    });

    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: '/v10/projects',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(projectData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const response = JSON.parse(data);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Project created successfully!');
          console.log('Project ID:', response.id);
          console.log('Project Name:', response.name);
          console.log('Project URL:', `https://${response.name}.vercel.app`);
          
          // Save project info
          fs.writeFileSync('.vercel-project.json', JSON.stringify(response, null, 2));
          
        } else {
          console.error('❌ Error creating project:', response);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
    });

    req.write(projectData);
    req.end();

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createVercelProject();