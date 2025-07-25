// Direct test of the create-order API to debug the quantity issue
// This simulates what the Voice AI agent sends

async function testCreateOrder() {
  console.log('🧪 Testing create-order API directly...\n');
  
  // Test 1: Single item with quantity 1
  const testOrder1 = {
    userId: 'user_1752538556589_u705p8e0q',
    customerName: 'Test Customer',
    items: [
      {
        itemName: 'chicken biryani',
        quantity: 1,
        specialInstructions: ''
      }
    ],
    orderType: 'dine-in',
    tableId: 't1'
  };
  
  console.log('=== Test 1: Single item with quantity 1 ===');
  console.log('Sending:', JSON.stringify(testOrder1, null, 2));
  
  try {
    const response1 = await fetch('http://localhost:9003/api/voice-agent/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder1)
    });
    
    const result1 = await response1.json();
    console.log('Response:', JSON.stringify(result1, null, 2));
    
    if (result1.success) {
      console.log(`✅ Created order with ${result1.matchedItems} items`);
      console.log(`Order total: $${result1.orderDetails.totalAmount}`);
    } else {
      console.log('❌ Order creation failed:', result1.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: What if the Voice AI accidentally sends multiple duplicate items?
  const testOrder2 = {
    userId: 'user_1752538556589_u705p8e0q',
    customerName: 'Test Customer',
    items: [
      { itemName: 'chicken biryani', quantity: 1, specialInstructions: '' },
      { itemName: 'chicken biryani', quantity: 1, specialInstructions: '' },
      { itemName: 'chicken biryani', quantity: 1, specialInstructions: '' },
      { itemName: 'chicken biryani', quantity: 1, specialInstructions: '' },
      { itemName: 'chicken biryani', quantity: 1, specialInstructions: '' }
    ],
    orderType: 'dine-in',
    tableId: 't1'
  };
  
  console.log('=== Test 2: Multiple duplicate items (the bug scenario) ===');
  console.log('Sending:', JSON.stringify(testOrder2, null, 2));
  
  try {
    const response2 = await fetch('http://localhost:9003/api/voice-agent/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOrder2)
    });
    
    const result2 = await response2.json();
    console.log('Response:', JSON.stringify(result2, null, 2));
    
    if (result2.success) {
      console.log(`✅ Created order with ${result2.matchedItems} items (should be 1 after deduplication)`);
      console.log(`Order total: $${result2.orderDetails.totalAmount} (should be 1 x biryani price)`);
    } else {
      console.log('❌ Order creation failed:', result2.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCreateOrder().catch(console.error);
