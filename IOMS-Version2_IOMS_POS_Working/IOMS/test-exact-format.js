/**
 * 🎯 Test Exact Retell AI Format
 * Simulates the real payload from your logs
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

// Exact format based on your logs (no event_type, no analysis)
const realRetellFormat = {
  call_id: 'call_test_real_' + Date.now(),
  agent_id: 'agent_d21bd990712e0e22b27224c45b',
  call_status: 'ended',
  call_type: 'inbound',
  from_number: '+1234567890',
  to_number: '+19876543210',
  start_timestamp: new Date(Date.now() - 300000).toISOString(),
  end_timestamp: new Date().toISOString(),
  duration: 300,
  transcript: "Customer: Hello, I'd like to make a reservation please. Agent: Of course! What's your name? Customer: It's Sarah Johnson. Agent: Great! How many people will be dining? Customer: Four people. Agent: Perfect! What time would you prefer? Customer: 7 PM tomorrow. Agent: Excellent! I've got you down for a table for 4 under Sarah Johnson tomorrow at 7 PM."
  // No analysis field - exactly like your real calls
};

console.log('🎯 Testing EXACT Retell AI format from your logs...');
console.log('📞 No event_type, no analysis - just like real calls');
console.log('📋 Should extract: Sarah Johnson, 4 people, tomorrow 7 PM');

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer default-secret-dev',
    'X-Retell-Signature': 'retell_signature_12345678901234567890',
    'User-Agent': 'RetellAI-Webhook/1.0'
  },
  body: JSON.stringify(realRetellFormat)
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
      console.log('\n🎉 SUCCESS! Real format works!');
      console.log('🆔 Reservation ID:', json.reservation_id);
      console.log('📞 Your actual Retell AI calls should now create reservations!');
      console.log('\n📋 ✅ CHECK YOUR IOMS DASHBOARD!');
      console.log('🔗 https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/dashboard');
      
      console.log('\n🎯 NEXT: Make a real call to test!');
      console.log('📞 Call your Retell AI number');
      console.log('🗣️ Say: "Hi, I want to book a table for [X] people [when], my name is [Your Name]"');
      
    } else if (json.message) {
      console.log('ℹ️ Response:', json.message);
      if (json.call_id) {
        console.log('🆔 Call processed:', json.call_id);
      }
    }
  } catch (e) {
    console.log('⚠️ Response not JSON:', text.substring(0, 300));
  }
})
.catch(err => console.error('❌ Error:', err));
