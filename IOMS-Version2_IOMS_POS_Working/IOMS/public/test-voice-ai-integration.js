/**
 * 🧪 Voice AI Agent Real POS Integration Test Script
 * 
 * This script tests the connection between the Voice AI Agent and the real POS system.
 * Run this from the browser console to verify the integration works.
 */

console.log('🎤 Voice AI Agent Real POS Integration Test');
console.log('=========================================');

// Test user ID (replace with actual user ID when testing)
const testUserId = 'demo-user';

async function testMenuAPI() {
  console.log('\n📋 Testing Menu API...');
  
  try {
    const response = await fetch(`/api/voice-agent/menu?userId=${testUserId}`);
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Menu API working - Found ${result.totalItems} items`);
      console.log('Sample menu items:', result.menuItems.slice(0, 3));
      console.log('Categories:', result.categories);
      return true;
    } else {
      console.error('❌ Menu API failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Menu API error:', error);
    return false;
  }
}

async function testTablesAPI() {
  console.log('\n🪑 Testing Tables API...');
  
  try {
    // Test getting all tables
    const response = await fetch(`/api/voice-agent/tables?userId=${testUserId}&action=all`);
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Tables API working - Found ${result.tables.length} tables`);
      console.log('Table summary:', result.summary);
      
      // Test finding a table for party of 4
      const findResponse = await fetch(`/api/voice-agent/tables?userId=${testUserId}&action=find&partySize=4`);
      const findResult = await findResponse.json();
      
      if (findResult.success) {
        console.log('✅ Table finding works - Best table:', findResult.table);
        return true;
      } else {
        console.log('⚠️ No tables available for party of 4:', findResult.message);
        return true; // This is still a success - just no tables available
      }
    } else {
      console.error('❌ Tables API failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Tables API error:', error);
    return false;
  }
}

async function testOrderCreation() {
  console.log('\n🛒 Testing Order Creation API...');
  
  try {
    // Test creating an order
    const orderData = {
      userId: testUserId,
      customerName: 'Test Customer',
      items: [
        { itemName: 'pizza', quantity: 1 },
        { itemName: 'burger', quantity: 2 }
      ],
      orderType: 'dine-in',
      tableId: 't1'
    };
    
    const response = await fetch('/api/voice-agent/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Order creation works!');
      console.log('Order ID:', result.orderId);
      console.log('Order details:', result.orderDetails);
      console.log('Matched items:', result.matchedItems);
      if (result.unmatchedItems) {
        console.log('Unmatched items:', result.unmatchedItems);
      }
      return true;
    } else {
      console.error('❌ Order creation failed:', result.error);
      if (result.unmatchedItems) {
        console.log('Unmatched items:', result.unmatchedItems);
      }
      if (result.availableItems) {
        console.log('Available menu items:', result.availableItems);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Order creation error:', error);
    return false;
  }
}

async function testVoiceChat() {
  console.log('\n🎤 Testing Voice AI Chat Integration...');
  
  try {
    // Test order request
    const orderResponse = await fetch('/api/voice-agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I want to order a pizza and burger',
        sessionId: 'test-session-' + Date.now(),
        isVoice: true,
        userId: testUserId
      })
    });
    
    const orderResult = await orderResponse.json();
    
    if (orderResult.success) {
      console.log('✅ Voice chat order processing works!');
      console.log('AI Response:', orderResult.response);
      console.log('Action taken:', orderResult.action);
    } else {
      console.error('❌ Voice chat order failed:', orderResult.error);
    }
    
    // Test reservation request
    const reservationResponse = await fetch('/api/voice-agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'I need a table for 4 people tonight at 7 PM',
        sessionId: 'test-session-' + Date.now(),
        isVoice: true,
        userId: testUserId
      })
    });
    
    const reservationResult = await reservationResponse.json();
    
    if (reservationResult.success) {
      console.log('✅ Voice chat reservation processing works!');
      console.log('AI Response:', reservationResult.response);
      console.log('Action taken:', reservationResult.action);
      return true;
    } else {
      console.error('❌ Voice chat reservation failed:', reservationResult.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Voice chat integration error:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Running all Voice AI POS integration tests...\n');
  
  const menuTest = await testMenuAPI();
  const tablesTest = await testTablesAPI();
  const orderTest = await testOrderCreation();
  const voiceChatTest = await testVoiceChat();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log('Menu API:', menuTest ? '✅ PASS' : '❌ FAIL');
  console.log('Tables API:', tablesTest ? '✅ PASS' : '❌ FAIL');
  console.log('Order Creation:', orderTest ? '✅ PASS' : '❌ FAIL');
  console.log('Voice Chat Integration:', voiceChatTest ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = menuTest && tablesTest && orderTest && voiceChatTest;
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Voice AI Agent is successfully integrated with the real POS system!');
    console.log('\n💡 Next steps:');
    console.log('1. Test with actual menu items in your restaurant');
    console.log('2. Set up real table configuration');
    console.log('3. Test voice recognition with different speech patterns');
    console.log('4. Configure user authentication for production');
  } else {
    console.log('\n⚠️ Some tests failed. Check the errors above and:');
    console.log('1. Ensure you have menu items set up');
    console.log('2. Check that the user ID is valid');
    console.log('3. Verify all API endpoints are working');
  }
  
  return allPassed;
}

// Run the tests
runAllTests().catch(console.error);

// Export for manual testing
window.voiceAITest = {
  testMenuAPI,
  testTablesAPI,
  testOrderCreation,
  testVoiceChat,
  runAllTests
};

console.log('\n💡 You can also run individual tests:');
console.log('- window.voiceAITest.testMenuAPI()');
console.log('- window.voiceAITest.testTablesAPI()');
console.log('- window.voiceAITest.testOrderCreation()');
console.log('- window.voiceAITest.testVoiceChat()');
console.log('- window.voiceAITest.runAllTests()');
