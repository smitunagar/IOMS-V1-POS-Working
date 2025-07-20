/**
 * 🧪 Test Public Webhook Endpoint
 * Tests the no-auth public webhook
 */

const PUBLIC_WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook-public';

// Sample Retell AI webhook payload
const testPayload = {
  event_type: "call_ended",
  timestamp: new Date().toISOString(),
  call: {
    call_id: "test_call_public_123",
    agent_id: "sam_ai_agent",
    call_type: "inbound",
    call_status: "ended",
    from_number: "+1234567890",
    to_number: "+19876543210",
    start_timestamp: new Date(Date.now() - 300000).toISOString(),
    end_timestamp: new Date().toISOString(),
    duration: 300,
    transcript: {
      text: "Customer: Hi, I'd like to make a reservation for 6 people this Friday at 8 PM. Agent: Perfect! Can I get your name? Customer: Sarah Johnson. Agent: Great! I've booked a table for 6 people under Sarah Johnson for Friday at 8 PM.",
      confidence: 0.95
    },
    call_analysis: {
      summary: "Sarah Johnson made a reservation for 6 people Friday at 8 PM",
      intent: "table_reservation",
      entities: {
        customer_name: "Sarah Johnson",
        party_size: 6,
        date: "Friday",
        time: "8 PM"
      },
      confidence_score: 0.95
    }
  }
};

async function testPublicWebhook() {
  console.log('🧪 Testing PUBLIC webhook endpoint...');
  console.log(`📍 URL: ${PUBLIC_WEBHOOK_URL}`);
  
  try {
    const response = await fetch(PUBLIC_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RetellAI-Test/1.0'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`✅ Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 Response: ${responseText}`);
    
    if (response.status === 200) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('🎉 SUCCESS! Webhook processed the request');
        console.log('📊 Response data:', jsonResponse);
        
        if (jsonResponse.reservation_id) {
          console.log('🏪 Reservation created with ID:', jsonResponse.reservation_id);
        }
      } catch (e) {
        console.log('⚠️ Response was successful but not valid JSON');
      }
    } else {
      console.log('❌ Failed with status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test GET endpoint first
async function testGetEndpoint() {
  console.log('🧪 Testing GET endpoint...');
  
  try {
    const response = await fetch(PUBLIC_WEBHOOK_URL, {
      method: 'GET'
    });
    
    console.log(`✅ GET Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📄 GET Response: ${responseText}`);
    
  } catch (error) {
    console.error('❌ GET Error:', error.message);
  }
}

// Run tests
console.log('🚀 Starting PUBLIC webhook tests...');
testGetEndpoint()
  .then(() => new Promise(resolve => setTimeout(resolve, 2000)))
  .then(() => testPublicWebhook());
