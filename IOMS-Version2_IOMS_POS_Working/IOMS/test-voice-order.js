/**
 * Test script to debug voice order processing
 */

// Use node-fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testVoiceOrder() {
  console.log('🧪 Testing Voice Order Processing...\n');
  
  const baseUrl = 'http://localhost:9003';
  const sessionId = `test-session-${Date.now()}`;
  const userId = 'user_1752538556589_u705p8e0q';
  
  try {
    // Test 1: Test menu API
    console.log('1️⃣ Testing Menu API...');
    const menuResponse = await fetch(`${baseUrl}/api/voice-agent/menu?userId=${userId}`);
    const menuData = await menuResponse.json();
    console.log('Menu Response:', JSON.stringify(menuData, null, 2));
    
    if (menuData.success && menuData.dishes) {
      console.log(`✅ Found ${menuData.dishes.length} menu items`);
      const samosaItems = menuData.dishes.filter(dish => 
        dish.name.toLowerCase().includes('samosa')
      );
      console.log(`🥟 Found ${samosaItems.length} samosa items:`, samosaItems.map(item => item.name));
    } else {
      console.log('❌ Menu API failed');
      return;
    }
    
    console.log('\n');
    
    // Test 2: Test voice chat with "vegetable samosa"
    console.log('2️⃣ Testing Voice Chat with "vegetable samosa"...');
    const chatResponse = await fetch(`${baseUrl}/api/voice-agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'hello I want to order one vegetable samosa',
        sessionId,
        isVoice: true,
        userId
      })
    });
    
    const chatData = await chatResponse.json();
    console.log('Chat Response:', JSON.stringify(chatData, null, 2));
    
    if (chatData.success) {
      console.log('✅ Chat API responded successfully');
      console.log('Intent:', chatData.intent);
      console.log('Response:', chatData.response);
      
      if (chatData.action && chatData.action.type === 'order') {
        if (chatData.action.success) {
          console.log('✅ Order created successfully!');
        } else {
          console.log('❌ Order creation failed');
        }
      }
    } else {
      console.log('❌ Chat API failed:', chatData.error);
    }
    
    console.log('\n');
    
    // Test 3: Test direct create-order API
    console.log('3️⃣ Testing Direct Create-Order API...');
    const createOrderResponse = await fetch(`${baseUrl}/api/voice-agent/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        customerName: 'Test Customer',
        items: [{
          itemName: 'vegetable samosa',
          quantity: 1,
          specialInstructions: ''
        }],
        orderType: 'dine-in',
        tableId: 't1'
      })
    });
    
    const orderData = await createOrderResponse.json();
    console.log('Create Order Response:', JSON.stringify(orderData, null, 2));
    
    if (orderData.success) {
      console.log('✅ Direct order creation successful!');
    } else {
      console.log('❌ Direct order creation failed:', orderData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testVoiceOrder();
