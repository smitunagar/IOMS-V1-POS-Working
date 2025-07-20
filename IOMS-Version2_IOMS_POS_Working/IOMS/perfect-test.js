/**
 * 🎯 PERFECT Webhook Test - Correct Data Structure
 * This matches exactly what the webhook expects
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

// Perfect payload format matching webhook expectations
const perfectPayload = {
  event_type: "call_ended",
  timestamp: new Date().toISOString(),
  call: {
    call_id: "perfect_test_" + Date.now(),
    agent_id: "sam_ai_agent",
    call_type: "inbound",
    call_status: "ended",
    from_number: "+1234567890",
    to_number: "+19876543210",
    start_timestamp: new Date(Date.now() - 360000).toISOString(), // 6 min ago
    end_timestamp: new Date().toISOString(),
    duration: 360,
    transcript: {
      text: "Customer: Hello, I'd like to make a reservation for 5 people this Saturday at 7:30 PM. Agent: Absolutely! May I have your name please? Customer: Yes, it's Jennifer Wilson. Agent: Perfect! I've booked a table for 5 people under Jennifer Wilson for Saturday at 7:30 PM. Your reservation is confirmed!",
      confidence: 0.98
    },
    analysis: {
      confidence_score: 0.98,
      requires_followup: false,
      
      // Customer info structure the webhook expects
      customer_info: {
        name: "Jennifer Wilson",
        phone: "+1234567890",
        email: null
      },
      
      // Reservation info structure the webhook expects  
      reservation_info: {
        date_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now (Saturday)
        party_size: 5,
        special_requests: null,
        occasion: "dinner"
      },
      
      // Order info (empty for reservation-only)
      order_info: {
        items: [],
        order_type: "dine-in",
        delivery_address: null,
        preferred_time: null
      }
    }
  }
};

console.log('🎯 Testing PERFECT webhook with correct data structure...');
console.log('📞 Simulating call from Jennifer Wilson');
console.log('👥 Party of 5 for Saturday at 7:30 PM');
console.log('🔧 Using proper customer_info and reservation_info structure');

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer default-secret-dev',
    'X-Retell-Signature': 'retell_signature_12345678901234567890',
    'User-Agent': 'RetellAI-Webhook/1.0'
  },
  body: JSON.stringify(perfectPayload)
})
.then(response => {
  console.log('✅ Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('📄 Response:', text);
  
  try {
    const json = JSON.parse(text);
    if (json.success && json.reservation_id) {
      console.log('\n🎉🎉🎉 PERFECT SUCCESS! RESERVATION CREATED! 🎉🎉🎉');
      console.log('🆔 Reservation ID:', json.reservation_id);
      console.log('👤 Customer: Jennifer Wilson');
      console.log('📞 Phone: +1234567890');
      console.log('👥 Party Size: 5 people');
      console.log('📅 Date: Saturday at 7:30 PM');
      console.log('\n📋 ✅ CHECK YOUR IOMS DASHBOARD NOW!');
      console.log('🔗 https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/dashboard');
      console.log('\n🔗 ✅ RETELL AI WEBHOOK URL (WORKING):');
      console.log(`   ${WEBHOOK_URL}`);
      console.log('\n📋 Required Headers for Retell AI:');
      console.log('   Authorization: Bearer default-secret-dev');
      console.log('   Content-Type: application/json');
      console.log('\n🎯 Your SAM AI integration is READY!');
    } else if (json.errors && json.errors.length > 0) {
      console.log('❌ Errors:', json.errors);
    } else if (json.message) {
      console.log('ℹ️ Message:', json.message);
    }
  } catch (e) {
    console.log('⚠️ Response not JSON:', text);
  }
})
.catch(err => console.error('❌ Error:', err));
