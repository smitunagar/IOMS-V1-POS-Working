/**
 * 🧪 Simple Webhook Test with Authentication
 * Tests webhook with proper Retell AI headers
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';
const DEBUG_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook-debug';
const WEBHOOK_SECRET = 'default-secret-dev'; // Using the default secret from the code

// Sample Retell AI webhook payload format
const retellPayload = {
  event_type: "call_ended",
  timestamp: new Date().toISOString(),
  call: {
    call_id: "test_call_12345",
    agent_id: "sam_ai_agent",
    call_type: "inbound",
    call_status: "ended",
    from_number: "+1234567890",
    to_number: "+19876543210",
    start_timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    end_timestamp: new Date().toISOString(),
    duration: 300, // 5 minutes
    transcript: {
      text: "Customer: Hi, I'd like to make a reservation for 4 people tomorrow at 7 PM. Agent: Perfect! I can help you with that. Can I get your name please? Customer: Yes, it's John Smith. Agent: Great! I've booked a table for 4 people under John Smith for tomorrow at 7 PM. Your reservation is confirmed!",
      confidence: 0.95
    },
    call_analysis: {
      summary: "Customer John Smith made a reservation for 4 people tomorrow at 7 PM",
      intent: "table_reservation",
      entities: {
        customer_name: "John Smith",
        party_size: 4,
        date: "tomorrow",
        time: "7 PM"
      }
    }
  }
};

async function testWithAuth() {
  console.log('🧪 Testing webhook with authentication...');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_SECRET}`,
        'User-Agent': 'RetellAI-Webhook/1.0',
        'X-Retell-Signature': 'test_signature_12345678901234567890' // 20+ chars
      },
      body: JSON.stringify(retellPayload)
    });
    
    console.log(`✅ Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 Response: ${responseText}`);
    
    if (response.status === 200) {
      console.log('🎉 SUCCESS! Webhook accepted the request');
    } else {
      console.log('❌ Failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testDebugEndpoint() {
  console.log('\n🧪 Testing debug endpoint...');
  
  try {
    const response = await fetch(DEBUG_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0'
      },
      body: JSON.stringify({ test: 'debug payload' })
    });
    
    console.log(`✅ Debug Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 Debug Response: ${responseText.substring(0, 300)}...`);
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  }
}

// Run tests
console.log('🚀 Starting authenticated webhook tests...');
testWithAuth().then(() => testDebugEndpoint());
