// Quick test for Voice AI extraction issue
// Run this to test what happens when someone says "I want one chicken biryani"

const testTranscripts = [
  "I want one chicken biryani",
  "I want 1 chicken biryani", 
  "Can I get one chicken biryani please",
  "I would like one chicken biryani",
  "One chicken biryani please"
];

async function testExtraction(transcript) {
  console.log(`\n=== Testing: "${transcript}" ===`);
  
  try {
    const response = await fetch('http://localhost:9003/api/ai/extract-order-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    
    const result = await response.json();
    console.log('AI Extraction Result:', JSON.stringify(result, null, 2));
    
    if (result.items) {
      console.log(`Found ${result.items.length} items:`);
      result.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} - Quantity: ${item.quantity}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Voice AI extraction for quantity handling...\n');
  
  for (const transcript of testTranscripts) {
    await testExtraction(transcript);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
}

// Run the tests
runTests().catch(console.error);
