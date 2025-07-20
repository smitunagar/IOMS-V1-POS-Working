/**
 * 🧪 Test Webhook with Vercel Bypass
 * Tests webhook with Vercel protection bypass header
 */

const PUBLIC_WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook-public';
const MAIN_WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

// Test payload
const testPayload = {
  event_type: "call_ended",
  timestamp: new Date().toISOString(),
  call: {
    call_id: "test_call_bypass_456",
    agent_id: "sam_ai_agent",
    call_type: "inbound",
    call_status: "ended",
    from_number: "+1234567890",
    to_number: "+19876543210",
    start_timestamp: new Date(Date.now() - 300000).toISOString(),
    end_timestamp: new Date().toISOString(),
    duration: 300,
    transcript: {
      text: "Customer: Hi, I need to book a table for 8 people this Saturday at 6 PM. Agent: Absolutely! Can I get your name? Customer: Mike Wilson. Agent: Perfect! I've reserved a table for 8 people under Mike Wilson for Saturday at 6 PM.",
      confidence: 0.98
    },
    call_analysis: {
      summary: "Mike Wilson booked a table for 8 people Saturday at 6 PM",
      intent: "table_reservation",
      entities: {
        customer_name: "Mike Wilson",
        party_size: 8,
        date: "Saturday",
        time: "6 PM"
      },
      confidence_score: 0.98
    }
  }
};

async function testWithBypass(url, name) {
  console.log(`\n🧪 Testing ${name} with Vercel bypass...`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RetellAI-Webhook/1.0',
        'X-Vercel-Protection-Bypass': 'retell-webhook-bypass-2025', // Bypass header
        'Authorization': 'Bearer default-secret-dev', // For main webhook auth
        'X-Retell-Signature': 'retell_signature_12345678901234567890' // 20+ chars
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`✅ Status: ${response.status}`);
    const responseText = await response.text();
    
    if (response.status === 200) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('🎉 SUCCESS! Webhook processed the request');
        console.log('📊 Response:', jsonResponse);
        
        if (jsonResponse.reservation_id) {
          console.log('🏪 Reservation created with ID:', jsonResponse.reservation_id);
        }
      } catch (e) {
        console.log('📄 Raw response:', responseText.substring(0, 200));
      }
    } else {
      console.log(`❌ Failed with status: ${response.status}`);
      console.log('📄 Error response:', responseText.substring(0, 300));
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${name}:`, error.message);
  }
}

async function testGetEndpoint(url, name) {
  console.log(`\n🧪 Testing ${name} GET endpoint...`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Vercel-Protection-Bypass': 'retell-webhook-bypass-2025'
      }
    });
    
    console.log(`✅ GET Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 GET Response: ${responseText.substring(0, 200)}...`);
    
  } catch (error) {
    console.error(`❌ GET Error for ${name}:`, error.message);
  }
}

// Run comprehensive tests
console.log('🚀 Starting webhook tests with Vercel bypass...');
console.log('⚠️  Make sure you have added the bypass secret to Vercel settings!');

async function runAllTests() {
  // Test GET endpoints first
  await testGetEndpoint(PUBLIC_WEBHOOK_URL, 'Public Webhook');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testGetEndpoint(MAIN_WEBHOOK_URL, 'Main Webhook');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test POST endpoints
  await testWithBypass(PUBLIC_WEBHOOK_URL, 'Public Webhook');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testWithBypass(MAIN_WEBHOOK_URL, 'Main Webhook');
  
  console.log('\n✅ All tests completed!');
  console.log('🔗 If successful, use this URL in Retell AI:');
  console.log(`   ${PUBLIC_WEBHOOK_URL}`);
  console.log('📋 With header: X-Vercel-Protection-Bypass: retell-webhook-bypass-2025');
}

runAllTests();
