#!/usr/bin/env node

/**
 * 🚀 SAM AI Integration Quick Setup
 * Helps configure your Retell AI integration with IOMS
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🤖 SAM AI Integration Setup\n');

// Generate secure webhook secret
const webhookSecret = crypto.randomBytes(32).toString('hex');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

let envContent = '';
if (envExists) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// SAM AI environment variables to add
const samAiEnvVars = `
# SAM AI Integration (Added by setup script)
RETELL_WEBHOOK_SECRET=${webhookSecret}
RETELL_API_KEY=your-retell-api-key-here
RETELL_AGENT_ID=your-agent-id-here
DEFAULT_USER_ID=user_1752538556589_u705p8e0q
AUTO_ASSIGN_TABLES=true
MIN_AI_CONFIDENCE=0.7
DEBUG_SAM_AI=false
`;

// Check if SAM AI vars already exist
if (envContent.includes('RETELL_WEBHOOK_SECRET')) {
  console.log('✅ SAM AI environment variables already configured');
} else {
  // Add SAM AI variables to .env.local
  const newEnvContent = envContent + samAiEnvVars;
  fs.writeFileSync(envPath, newEnvContent);
  console.log('✅ Added SAM AI environment variables to .env.local');
}

// Get deployment URL (if available)
let deploymentUrl = 'your-vercel-app.vercel.app';
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.name) {
    deploymentUrl = `${packageJson.name}.vercel.app`;
  }
} catch (e) {
  // Ignore if package.json not found
}

// Output configuration instructions
console.log('\n📋 Next Steps:\n');

console.log('1. 🔑 Update your Retell AI API credentials:');
console.log('   - Replace RETELL_API_KEY with your actual API key');
console.log('   - Replace RETELL_AGENT_ID with your agent ID');
console.log('   - Optionally update DEFAULT_USER_ID\n');

console.log('2. 🔗 Configure Retell AI Webhook:');
console.log(`   - Webhook URL: https://${deploymentUrl}/api/retell-webhook`);
console.log('   - Events: call_ended, call_analyzed');
console.log(`   - Secret: ${webhookSecret}`);
console.log('   - Content-Type: application/json\n');

console.log('3. 🚀 Deploy to Vercel:');
console.log('   npx vercel --prod\n');

console.log('4. 🧪 Test Integration:');
console.log('   - Go to /sam-ai-integration in your app');
console.log('   - Click "Test Webhook" button');
console.log('   - Make a test call to your Retell AI number\n');

console.log('5. 📖 Read Documentation:');
console.log('   - SAM_AI_INTEGRATION_GUIDE.md');
console.log('   - .env.sam-ai.template\n');

console.log('🎉 Setup complete! Your SAM AI integration is ready.\n');

// Create a simple test script
const testScript = `#!/usr/bin/env node

/**
 * Test SAM AI webhook endpoint
 */

const testPayload = {
  event_type: 'call_ended',
  timestamp: new Date().toISOString(),
  call: {
    call_id: 'test_' + Date.now(),
    agent_id: 'default',
    call_type: 'inbound',
    call_status: 'ended',
    from_number: '+1234567890',
    duration: 120,
    transcript: {
      text: 'Hi, I would like to make a reservation for 2 people tomorrow at 7 PM. My name is John Doe and my phone number is 555-1234.',
      confidence: 0.95
    },
    analysis: {
      customer_intent: 'reservation',
      customer_info: {
        name: 'John Doe',
        phone: '555-1234'
      },
      reservation_info: {
        date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        party_size: 3,
        special_requests: 'Window table if possible'
      },
      confidence_score: 0.95,
      requires_followup: false
    }
  }
};

const webhookUrl = process.argv[2] || 'http://localhost:3000/api/retell-webhook';
const webhookSecret = '${webhookSecret}';

console.log('🧪 Testing SAM AI webhook...');
console.log('URL:', webhookUrl);

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${webhookSecret}\`
  },
  body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(result => {
  console.log('✅ Test Result:', result);
})
.catch(error => {
  console.error('❌ Test Failed:', error);
});
`;

fs.writeFileSync('test-sam-ai-webhook.js', testScript);
fs.chmodSync('test-sam-ai-webhook.js', '755');
console.log('📝 Created test-sam-ai-webhook.js for testing');
console.log('   Usage: node test-sam-ai-webhook.js [webhook-url]');
