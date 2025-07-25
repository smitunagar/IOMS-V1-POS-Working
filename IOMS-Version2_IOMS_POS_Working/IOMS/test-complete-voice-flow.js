/**
 * Test complete voice ordering flow
 */

// Test imports (these would normally be ESM imports)
const { processVoiceOrder } = require('./src/lib/voiceOrderProcessor');

async function testCompleteVoiceFlow() {
  console.log('🧪 Testing Complete Voice Order Flow...\n');
  
  try {
    console.log('1️⃣ Testing Voice Order: "chicken biryani"');
    
    const result = await processVoiceOrder({
      userId: 'smit.kunagar@gmail.com',
      customerName: 'Voice Customer',
      items: [{
        itemName: 'chicken biryani',
        quantity: 1,
        specialInstructions: ''
      }],
      orderType: 'dine-in',
      tableId: 't1'
    });
    
    console.log('\n📊 Complete Test Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 SUCCESS: Voice ordering flow is working!');
      console.log('✅ Order ID:', result.orderId);
      console.log('✅ Order Number:', result.orderNumber);
      console.log('✅ Total Amount:', result.orderDetails?.totalAmount);
      console.log('✅ Items:', result.orderDetails?.items?.map(item => `${item.quantity}x ${item.name}`).join(', '));
    } else {
      console.log('\n❌ FAILED: Voice ordering flow failed');
      console.log('Error:', result.error);
      if (result.suggestions) {
        console.log('Suggestions:', result.suggestions.map(s => s.name).join(', '));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testCompleteVoiceFlow();
