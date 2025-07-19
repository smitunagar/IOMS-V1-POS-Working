#!/usr/bin/env node

/**
 * Test SAM AI webhook endpoint
 */

const testPayload = {
  event_type: 'call_ended',
  timestamp: new Date().toISOString(),
  call: {
    call_id: 'test_' + Date.now(),
    agent_id: 'default',
    call_type: 'inbound',
    call_status: 'ended',
    from_number: '+1234567890',
    duration: 120,
    transcript: {
      text: 'Hi, I would like to make a reservation for 2 people tomorrow at 7 PM. My name is John Doe and my phone number is 555-1234.',
      confidence: 0.95
    },
    analysis: {
      customer_intent: 'reservation',
      customer_info: {
        name: 'John Doe',
        phone: '555-1234'
      },
      reservation_info: {
        date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        party_size: 2,
        special_requests: 'Window table if possible'
      },
      confidence_score: 0.95,
      requires_followup: false
    }
  }
};

const webhookUrl = process.argv[2] || 'http://localhost:3000/api/retell-webhook';
const webhookSecret = '0ffa72f7cac290412d568d02454f650c0a22168bbe48c8e89cb8131b1f55c6d8';

console.log('🧪 Testing SAM AI webhook...');
console.log('URL:', webhookUrl);

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${webhookSecret}`
  },
  body: JSON.stringify(testPayload)
})
.then(response => response.json())
.then(result => {
  console.log('✅ Test Result:', result);
})
.catch(error => {
  console.error('❌ Test Failed:', error);
});
