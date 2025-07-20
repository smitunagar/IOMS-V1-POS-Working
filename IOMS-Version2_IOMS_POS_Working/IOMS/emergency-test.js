/**
 * 🚨 EMERGENCY TEST - Minimal Retell Format
 * Tests the exact call that just came in
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

// Your exact call that just came in
const emergencyPayload = {
  call_id: 'call_206c55a5bdd5340785373b399a0',
  agent_id: 'agent_d21bd990712e0e22b27224c45b',
  call_status: 'ended',
  call_type: 'inbound',
  from_number: '+1234567890',
  duration: 180,
  transcript: "Customer: Hi, I want to book a table for 5 people tomorrow night at 7:30 PM. Agent: Absolutely! Can I get your name? Customer: It's Sarah Williams. Agent: Perfect! I've booked a table for 5 people under Sarah Williams for tomorrow at 7:30 PM. Your reservation is confirmed!"
};

console.log('🚨 EMERGENCY TEST - Testing exact format that just came in...');
console.log('📞 Call ID: call_206c55a5bdd5340785373b399a0');
console.log('🔍 Should create reservation for Sarah Williams, 5 people');

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer default-secret-dev',
    'X-Retell-Signature': 'emergency_signature_12345678901234567890'
  },
  body: JSON.stringify(emergencyPayload)
})
.then(response => {
  console.log('STATUS:', response.status);
  return response.text();
})
.then(text => {
  console.log('RESPONSE:', text);
  
  if (text.includes('reservation_id')) {
    console.log('\n🎉 EMERGENCY SUCCESS! WEBHOOK IS WORKING!');
    console.log('📋 CHECK YOUR DASHBOARD IMMEDIATELY!');
  } else if (text.includes('Ignoring')) {
    console.log('\n❌ Still being ignored - deployment not active yet');
  }
})
.catch(err => console.error('ERROR:', err));
