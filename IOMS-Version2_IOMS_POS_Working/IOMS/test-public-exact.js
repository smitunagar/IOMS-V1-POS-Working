/**
 * 🎯 Test Public Webhook with Exact Retell Format
 * Tests the real payload structure from your logs
 */

const PUBLIC_WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook-public';

// Exact format from your logs - direct payload, no wrapping
const exactRetellPayload = {
  call_id: 'call_02287f1fdbf01e6c3ffd10aafa5',
  agent_id: 'agent_d21bd990712e0e22b27224c45b',
  call_status: 'ended',
  call_type: 'inbound',
  from_number: '+1234567890',
  to_number: '+19876543210',
  start_timestamp: new Date(Date.now() - 300000).toISOString(),
  end_timestamp: new Date().toISOString(),
  duration: 300,
  transcript: "Agent: Hello! Welcome to our restaurant. How can I help you today? Customer: Hi, I'd like to make a reservation for 3 people tomorrow at 8 PM. Agent: Absolutely! May I have your name please? Customer: Yes, it's Mike Johnson. Agent: Perfect! I've booked a table for 3 people under Mike Johnson for tomorrow at 8 PM. Your reservation is confirmed!"
  // No event_type, no analysis - just like your real calls
};

console.log('🎯 Testing PUBLIC webhook with exact Retell AI format...');
console.log('📞 Direct payload format (no call wrapper)');
console.log('🔍 call_status: ended (should process)');
console.log('📋 Should extract: Mike Johnson, 3 people, tomorrow 8 PM');

fetch(PUBLIC_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'RetellAI-Webhook/1.0'
  },
  body: JSON.stringify(exactRetellPayload)
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
      console.log('\n🎉 SUCCESS! Public webhook works!');
      console.log('🆔 Reservation ID:', json.reservation_id);
      console.log('👤 Customer:', json.customer_name);
      console.log('👥 Party Size:', json.party_size);
      console.log('\n📋 ✅ CHECK YOUR IOMS DASHBOARD!');
      console.log('\n🔗 ✅ USE THIS URL IN RETELL AI:');
      console.log(`   ${PUBLIC_WEBHOOK_URL}`);
      console.log('\n📞 Your real calls should now work!');
      
    } else if (json.message) {
      console.log('ℹ️ Response:', json.message);
      if (json.call_id) {
        console.log('🆔 Call ID:', json.call_id);
      }
    }
  } catch (e) {
    console.log('⚠️ Response not JSON:', text.substring(0, 200));
  }
})
.catch(err => console.error('❌ Error:', err));
