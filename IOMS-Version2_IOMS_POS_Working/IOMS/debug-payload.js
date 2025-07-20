/**
 * 🔍 Debug Webhook Payload
 * Simple test to see what the webhook receives
 */

const WEBHOOK_URL = 'https://ioms-v1-pos-working-git-smit-nishants-projects-5417fec2.vercel.app/api/retell-webhook';

// Simple test payload
const debugPayload = {
  test: "debug",
  call_id: "debug_test_123"
};

console.log('🔍 Sending debug payload to see what webhook receives...');

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer default-secret-dev',
    'X-Retell-Signature': 'debug_signature_12345678901234567890'
  },
  body: JSON.stringify(debugPayload)
})
.then(response => {
  console.log('Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('Response:', text);
})
.catch(err => console.error('Error:', err));
