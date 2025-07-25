// Simplified test to verify Voice AI configuration
console.log('🔧 Voice AI Configuration Check\n');

// Check environment variables
console.log('Environment Configuration:');
console.log('- Port should be: 9003');
console.log('- Base URL should be: http://localhost:9003');

// Check if our fix files are in place
const fs = require('fs');
const path = require('path');

console.log('\n📁 File Check:');

// Check .env.local
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const hasCorrectUrl = envContent.includes('NEXT_PUBLIC_BASE_URL=http://localhost:9003');
  console.log('- .env.local has correct port:', hasCorrectUrl ? '✅' : '❌');
} catch (e) {
  console.log('- .env.local file:', '❌ Not found');
}

// Check voice-agent chat route
try {
  const chatRoute = fs.readFileSync('src/app/api/voice-agent/chat/route.ts', 'utf8');
  const hasCorrectFallback = chatRoute.includes('localhost:9003');
  console.log('- Chat API has correct port:', hasCorrectFallback ? '✅' : '❌');
} catch (e) {
  console.log('- Chat API file:', '❌ Error reading');
}

// Check voice-agent create-order route
try {
  const createOrderRoute = fs.readFileSync('src/app/api/voice-agent/create-order/route.ts', 'utf8');
  const hasSuggestions = createOrderRoute.includes('Did you mean:');
  const hasTyping = createOrderRoute.includes('{ name: string; price: number }[]');
  console.log('- Create Order API has suggestions:', hasSuggestions ? '✅' : '❌');
  console.log('- Create Order API has proper typing:', hasTyping ? '✅' : '❌');
} catch (e) {
  console.log('- Create Order API file:', '❌ Error reading');
}

console.log('\n🎯 Next Steps:');
console.log('1. Restart your development server (if running)');
console.log('2. Go to: http://localhost:9003/ai-order-agent');
console.log('3. Try: "I want to order one vegetable samosa"');
console.log('4. Expected: Suggestions for Samosa Chaat, Cheesy Samosa Bake');

console.log('\n✅ Configuration update complete!');
