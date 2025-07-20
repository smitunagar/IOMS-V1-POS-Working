/**
 * 🎯 FINAL Working Webhook Test
 * This will create a reservation in IOMS
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

// Proper Retell AI payload format that will create a reservation
const workingPayload = {
  event_type: "call_ended",
  timestamp: new Date().toISOString(),
  call: {
    call_id: "final_test_" + Date.now(),
    agent_id: "sam_ai_agent",
    call_type: "inbound",
    call_status: "ended",
    from_number: "+1234567890",
    to_number: "+19876543210",
    start_timestamp: new Date(Date.now() - 240000).toISOString(), // 4 min ago
    end_timestamp: new Date().toISOString(),
    duration: 240,
    transcript: {
      text: "Customer: Hi, I need to book a table for 4 people tomorrow at 7 PM. Agent: Absolutely! Can I get your name please? Customer: Yes, it's Alex Smith. Agent: Perfect! I've reserved a table for 4 people under Alex Smith for tomorrow at 7 PM. Your reservation is confirmed!",
      confidence: 0.95
    },
    call_analysis: {
      summary: "Alex Smith made a reservation for 4 people tomorrow at 7 PM",
      intent: "table_reservation",
      entities: {
        customer_name: "Alex Smith",
        party_size: 4,
        date: "tomorrow",
        time: "7 PM",
        reservation_type: "dinner"
      },
      confidence_score: 0.95,
      requires_followup: false
    }
  }
};

console.log('🎯 Testing FINAL webhook with proper reservation data...');
console.log('📞 Simulating call from Alex Smith for table reservation');

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer default-secret-dev',
    'X-Retell-Signature': 'retell_signature_12345678901234567890',
    'User-Agent': 'RetellAI-Webhook/1.0'
  },
  body: JSON.stringify(workingPayload)
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
      console.log('👤 Customer: Alex Smith');
      console.log('👥 Party Size: 4 people');
      console.log('📅 Date: Tomorrow at 7 PM');
      console.log('\n📋 CHECK YOUR IOMS DASHBOARD NOW!');
      console.log('🔗 The reservation should appear immediately');
    } else if (json.message) {
      console.log('ℹ️ Message:', json.message);
    }
  } catch (e) {
    console.log('⚠️ Response not JSON:', text);
  }
})
.catch(err => console.error('❌ Error:', err));
