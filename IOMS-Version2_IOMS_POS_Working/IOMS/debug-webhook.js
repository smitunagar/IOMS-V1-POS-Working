/**
 * Test Retell AI Webhook
 * This will help us debug what's happening
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';
const WEBHOOK_SECRET = '0ffa72f7cac290412d568d02454f650c0a22168bbe48c8e89cb8131b1f55c6d8';

// Test payload simulating a table reservation call
const testReservationPayload = {
  event_type: 'call_ended',
  timestamp: new Date().toISOString(),
  call: {
    call_id: `test_reservation_${Date.now()}`,
    agent_id: 'test-agent-123', // Your actual agent ID might be different
    call_type: 'inbound',
    call_status: 'ended',
    from_number: '+1234567890',
    duration: 180,
    transcript: {
      text: 'Hi, I would like to book a table for 4 people tomorrow at 7 PM. My name is John Smith and my phone number is 555-1234. Can you please confirm the reservation?',
      confidence: 0.95
    },
    analysis: {
      customer_intent: 'reservation',
      customer_info: {
        name: 'John Smith',
        phone: '555-1234'
      },
      reservation_info: {
        date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        party_size: 4,
        special_requests: 'Near the window if possible'
      },
      confidence_score: 0.95,
      requires_followup: false
    }
  }
};

console.log('🧪 Testing Retell AI webhook...');
console.log('URL:', WEBHOOK_URL);
console.log('Payload:', JSON.stringify(testReservationPayload, null, 2));

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${WEBHOOK_SECRET}`,
    'X-Retell-Signature': 'test-signature-' + Date.now(),
    'User-Agent': 'Retell-AI-Webhook-Test'
  },
  body: JSON.stringify(testReservationPayload)
})
.then(async (response) => {
  console.log('📊 Response Status:', response.status);
  console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
  
  const responseText = await response.text();
  console.log('📊 Response Body:', responseText);
  
  try {
    const responseJson = JSON.parse(responseText);
    console.log('📊 Parsed Response:', responseJson);
    
    if (responseJson.success) {
      console.log('✅ Test SUCCESS!');
      console.log('🎉 Reservation ID:', responseJson.reservation_id);
      console.log('🎉 Message:', responseJson.message);
    } else {
      console.log('❌ Test FAILED');
      console.log('❌ Error:', responseJson.message);
      console.log('❌ Errors:', responseJson.errors);
    }
  } catch (e) {
    console.log('❌ Could not parse response as JSON');
  }
})
.catch(error => {
  console.error('💥 Network Error:', error);
});
