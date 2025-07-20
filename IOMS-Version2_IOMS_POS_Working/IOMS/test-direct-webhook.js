/**
 * 🧪 Simple Direct Webhook Test
 * Test the main webhook endpoint directly
 */

const MAIN_WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

// Simple test payload matching Retell AI format
const testPayload = {
  event_type: "call_ended",
  timestamp: new Date().toISOString(),
  call: {
    call_id: "test_direct_789",
    agent_id: "sam_ai_agent",
    call_type: "inbound",
    call_status: "ended",
    from_number: "+1234567890",
    to_number: "+19876543210",
    start_timestamp: new Date(Date.now() - 180000).toISOString(), // 3 min ago
    end_timestamp: new Date().toISOString(),
    duration: 180,
    transcript: {
      text: "Customer: Hello, I want to book a table for 3 people tonight at 8 PM. Agent: Absolutely! What's your name? Customer: Lisa Chen. Agent: Perfect! Table for 3 under Lisa Chen tonight at 8 PM is confirmed.",
      confidence: 0.96
    },
    call_analysis: {
      summary: "Lisa Chen booked table for 3 people tonight at 8 PM",
      intent: "table_reservation",
      entities: {
        customer_name: "Lisa Chen",
        party_size: 3,
        date: "tonight",
        time: "8 PM"
      },
      confidence_score: 0.96
    }
  }
};

async function testMainWebhook() {
  console.log('🧪 Testing MAIN webhook endpoint...');
  console.log(`📍 URL: ${MAIN_WEBHOOK_URL}`);
  
  try {
    console.log('📤 Sending request...');
    
    const response = await fetch(MAIN_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RetellAI-Webhook/1.0',
        'Authorization': 'Bearer default-secret-dev',
        'X-Retell-Signature': 'retell_sig_12345678901234567890123456789012345'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`✅ Response Status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`📄 Response Length: ${responseText.length} characters`);
    
    if (response.status === 200) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('🎉 SUCCESS! Webhook accepted the request');
        console.log('📊 JSON Response:', JSON.stringify(jsonResponse, null, 2));
        
        if (jsonResponse.reservation_id) {
          console.log('🏪 ✅ RESERVATION CREATED! ID:', jsonResponse.reservation_id);
          console.log('📋 Go check your IOMS dashboard now!');
        }
        
        return true;
      } catch (e) {
        console.log('⚠️ Response was 200 but not JSON');
        console.log('📄 Raw response preview:', responseText.substring(0, 200));
      }
    } else {
      console.log(`❌ Failed with status: ${response.status}`);
      console.log('📄 Error response preview:', responseText.substring(0, 500));
      
      if (response.status === 401) {
        console.log('🔐 Authentication issue - checking auth headers...');
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    return false;
  }
}

async function testGetEndpoint() {
  console.log('\n🧪 Testing GET endpoint first...');
  
  try {
    const response = await fetch(MAIN_WEBHOOK_URL, {
      method: 'GET'
    });
    
    console.log(`✅ GET Status: ${response.status}`);
    const text = await response.text();
    console.log(`📄 GET Response preview: ${text.substring(0, 100)}...`);
    
  } catch (error) {
    console.error('❌ GET Error:', error.message);
  }
}

// Run tests
console.log('🚀 Testing webhook directly...');
console.log('🕒 Current time:', new Date().toISOString());

testGetEndpoint()
  .then(() => new Promise(resolve => setTimeout(resolve, 2000)))
  .then(() => testMainWebhook())
  .then((success) => {
    if (success) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. ✅ Webhook is working!');
      console.log('2. 🔗 Configure Retell AI with this URL:');
      console.log(`   ${MAIN_WEBHOOK_URL}`);
      console.log('3. 📞 Test with a real phone call');
      console.log('4. 📋 Check IOMS dashboard for reservations');
    } else {
      console.log('\n🔧 Need to troubleshoot webhook configuration...');
    }
  });
