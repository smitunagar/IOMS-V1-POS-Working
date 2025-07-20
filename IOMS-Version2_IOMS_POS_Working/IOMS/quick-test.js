/**
 * 🧪 Quick POST Test
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

const payload = {
  event_type: "call_ended",
  timestamp: new Date().toISOString(),
  call: {
    call_id: "quick_test_123",
    agent_id: "sam_ai_agent",
    call_type: "inbound",
    call_status: "ended",
    from_number: "+1234567890",
    transcript: {
      text: "Customer: Table for 2 at 7pm. Name is John. Agent: Booked for John, party of 2 at 7pm.",
      confidence: 0.9
    },
    call_analysis: {
      summary: "John booked table for 2 at 7pm",
      entities: {
        customer_name: "John",
        party_size: 2,
        time: "7pm"
      }
    }
  }
};

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer default-secret-dev',
    'X-Retell-Signature': 'signature12345678901234567890'
  },
  body: JSON.stringify(payload)
})
.then(response => {
  console.log('Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('Response:', text);
  if (text.includes('reservation_id')) {
    console.log('🎉 SUCCESS! Reservation created!');
  }
})
.catch(err => console.error('Error:', err));
