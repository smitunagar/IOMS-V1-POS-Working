/**
 * 🎯 CORRECTED Webhook Test - Fixed Analysis Field
 * This will create a reservation in IOMS
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

// Corrected payload format - "analysis" not "call_analysis"
const correctPayload = {
  event_type: "call_ended",
  timestamp: new Date().toISOString(),
  call: {
    call_id: "corrected_test_" + Date.now(),
    agent_id: "sam_ai_agent",
    call_type: "inbound",
    call_status: "ended",
    from_number: "+1234567890",
    to_number: "+19876543210",
    start_timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    end_timestamp: new Date().toISOString(),
    duration: 300,
    transcript: {
      text: "Customer: Hi, I want to book a table for 6 people this Friday at 8 PM. Agent: Perfect! Can I get your name? Customer: Maria Rodriguez. Agent: Excellent! I've booked a table for 6 people under Maria Rodriguez for Friday at 8 PM. Your reservation is confirmed!",
      confidence: 0.97
    },
    analysis: {  // <-- CORRECTED: "analysis" not "call_analysis"
      summary: "Maria Rodriguez made a reservation for 6 people this Friday at 8 PM",
      intent: "table_reservation",
      entities: {
        customer_name: "Maria Rodriguez",
        party_size: 6,
        date: "Friday",
        time: "8 PM",
        reservation_type: "dinner"
      },
      confidence_score: 0.97,
      requires_followup: false
    }
  }
};

console.log('🎯 Testing CORRECTED webhook with proper analysis field...');
console.log('📞 Simulating call from Maria Rodriguez for table reservation');
console.log('🔧 Using "analysis" field instead of "call_analysis"');

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer default-secret-dev',
    'X-Retell-Signature': 'retell_signature_12345678901234567890',
    'User-Agent': 'RetellAI-Webhook/1.0'
  },
  body: JSON.stringify(correctPayload)
})
.then(response => {
  console.log('✅ Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('📄 Response:', text);
  
  try {
    const json = JSON.parse(text);
    if (json.reservation_id) {
      console.log('\n🎉 SUCCESS! RESERVATION CREATED!');
      console.log('🆔 Reservation ID:', json.reservation_id);
      console.log('👤 Customer: Maria Rodriguez');
      console.log('👥 Party Size: 6 people');
      console.log('📅 Date: Friday at 8 PM');
      console.log('\n📋 CHECK YOUR IOMS DASHBOARD NOW!');
      console.log('🔗 URL: https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/dashboard');
      console.log('\n🔗 For Retell AI, use this webhook URL:');
      console.log(`   ${WEBHOOK_URL}`);
      console.log('📋 With headers:');
      console.log('   Authorization: Bearer default-secret-dev');
      console.log('   X-Retell-Signature: [your_signature]');
    } else if (json.message) {
      console.log('ℹ️ Message:', json.message);
      if (json.message.includes('No analysis')) {
        console.log('🔧 Still no analysis data - check webhook code expects "analysis" field');
      }
    }
  } catch (e) {
    console.log('⚠️ Response not JSON:', text);
  }
})
.catch(err => console.error('❌ Error:', err));
