/**
 * 🧪 Comprehensive Webhook Test Script
 * Tests both main and debug webhook endpoints
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';
const DEBUG_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook-debug';

// Sample Retell AI payload
const samplePayload = {
  call_id: "test_call_12345",
  agent_id: "sam_ai_agent",
  customer_number: "+1234567890",
  call_start_time: new Date().toISOString(),
  call_end_time: new Date().toISOString(),
  transcript: [
    {
      role: "agent",
      content: "Hello! Welcome to our restaurant. How can I help you today?"
    },
    {
      role: "user", 
      content: "Hi, I'd like to make a reservation for 4 people tomorrow at 7 PM"
    },
    {
      role: "agent",
      content: "Perfect! I can help you with that. Can I get your name please?"
    },
    {
      role: "user",
      content: "Yes, it's John Smith"
    },
    {
      role: "agent",
      content: "Great! I've booked a table for 4 people under John Smith for tomorrow at 7 PM. Your reservation is confirmed!"
    }
  ],
  call_summary: "Customer John Smith made a reservation for 4 people tomorrow at 7 PM",
  call_successful: true
};

async function testWebhook(url, name) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RetellAI-Webhook/1.0'
      },
      body: JSON.stringify(samplePayload)
    });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`📄 Response: ${responseText.substring(0, 500)}${responseText.length > 500 ? '...' : ''}`);
    
    // Try to parse as JSON
    try {
      const jsonResponse = JSON.parse(responseText);
      console.log(`✅ Valid JSON response`);
      console.log(`📊 Response data:`, jsonResponse);
    } catch (e) {
      console.log(`❌ Not valid JSON: ${e.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${name}:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive webhook tests...');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  
  // Test debug endpoint first
  await testWebhook(DEBUG_URL, 'Debug Webhook');
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test main webhook
  await testWebhook(WEBHOOK_URL, 'Main Webhook');
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests().catch(console.error);
