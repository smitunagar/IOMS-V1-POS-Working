// Debug Voice AI API - Test "vegetable samosa" directly
// This will help us test the API without the UI

const testVoiceAI = async () => {
  const baseUrl = 'http://localhost:9003';
  
  console.log('🧪 Testing Voice AI API with "vegetable samosa"...\n');
  
  try {
    // Test 1: Voice Chat API
    console.log('1️⃣ Testing Voice Chat API...');
    const chatResponse = await fetch(`${baseUrl}/api/voice-agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I want to order one vegetable samosa',
        sessionId: 'test-session-' + Date.now(),
        isVoice: true,
        userId: 'demo-user'
      })
    });
    
    const chatResult = await chatResponse.json();
    console.log('Chat API Response:', JSON.stringify(chatResult, null, 2));
    
    // Test 2: Create Order API directly
    console.log('\n2️⃣ Testing Create Order API directly...');
    const orderResponse = await fetch(`${baseUrl}/api/voice-agent/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'demo-user',
        customerName: 'Test Customer',
        items: [
          { itemName: 'vegetable samosa', quantity: 1, specialInstructions: '' }
        ],
        orderType: 'dine-in',
        tableId: 't1'
      })
    });
    
    const orderResult = await orderResponse.json();
    console.log('Create Order API Response:', JSON.stringify(orderResult, null, 2));
    
    // Test 3: Menu API
    console.log('\n3️⃣ Testing Menu API...');
    const menuResponse = await fetch(`${baseUrl}/api/voice-agent/menu?userId=demo-user`);
    const menuResult = await menuResponse.json();
    console.log('Menu API Response (first 5 items):', 
      menuResult.menuItems?.slice(0, 5).map(item => ({ name: item.name, price: item.price }))
    );
    
  } catch (error) {
    console.error('❌ Error testing APIs:', error.message);
    console.log('\n💡 Make sure the development server is running on port 3000');
    console.log('   Run: npm run dev');
  }
};

// Run the test
testVoiceAI();
