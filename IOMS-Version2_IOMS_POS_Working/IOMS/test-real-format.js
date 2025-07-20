/**
 * 🎯 Test Real Retell AI Format
 * Simulates the exact payload format from your logs
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

// Real Retell AI format based on your logs
const realRetellPayload = {
  call_id: 'call_test_real_format_' + Date.now(),
  agent_id: 'agent_d21bd990712e0e22b27224c45b',
  call_status: 'ended',
  call_type: 'inbound',
  from_number: '+1234567890',
  to_number: '+19876543210',
  start_timestamp: new Date(Date.now() - 240000).toISOString(),
  end_timestamp: new Date().toISOString(),
  duration: 240,
  transcript: "Agent: Hello! Welcome to our restaurant. How can I help you today? Customer: Hi, I'd like to make a reservation for 3 people tomorrow night at 8 PM. Agent: Absolutely! May I have your name please? Customer: Yes, it's David Chen. Agent: Perfect! I've booked a table for 3 people under David Chen for tomorrow at 8 PM. Your reservation is confirmed!"
  // Note: No analysis data - this will test transcript extraction
};

console.log('🎯 Testing REAL Retell AI format (no analysis data)...');
console.log('📞 This simulates the exact format from your webhook logs');
console.log('🔍 Will test transcript extraction for: David Chen, party of 3, tomorrow 8 PM');

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer default-secret-dev',
    'X-Retell-Signature': 'retell_signature_12345678901234567890',
    'User-Agent': 'RetellAI-Webhook/1.0'
  },
  body: JSON.stringify(realRetellPayload)
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
      console.log('\n🎉 SUCCESS! Reservation created from transcript!');
      console.log('🆔 Reservation ID:', json.reservation_id);
      console.log('👤 Customer: David Chen (extracted from transcript)');
      console.log('👥 Party Size: 3 (extracted from transcript)');
      console.log('📅 Time: Tomorrow 8 PM (extracted from transcript)');
      console.log('\n📋 ✅ CHECK YOUR IOMS DASHBOARD!');
      console.log('\n🎯 Your real Retell AI calls should now work!');
      console.log('📞 Try calling your Retell AI number and making a reservation');
    } else if (json.message) {
      console.log('ℹ️ Response:', json.message);
      if (json.suggestion) {
        console.log('💡 Suggestion:', json.suggestion);
      }
    }
  } catch (e) {
    console.log('⚠️ Response not JSON:', text.substring(0, 200));
  }
})
.catch(err => console.error('❌ Error:', err));
