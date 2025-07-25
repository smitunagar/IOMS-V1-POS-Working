/**
 * Simple test to verify voice order processing works
 */

// Test the voice order processor directly
import { processVoiceOrder } from '../src/lib/voiceOrderProcessor';

async function testVoiceOrderProcessor() {
  console.log('🧪 Testing Voice Order Processor...\n');
  
  try {
    const result = await processVoiceOrder({
      userId: 'user_1752538556589_u705p8e0q',
      customerName: 'Test Customer',
      items: [{
        itemName: 'vegetable samosa',
        quantity: 1,
        specialInstructions: ''
      }],
      orderType: 'dine-in',
      tableId: 't1'
    });
    
    console.log('✅ Voice Order Processor Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 SUCCESS: Voice ordering is working!');
    } else {
      console.log('\n❌ FAILED: Voice ordering failed with error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testVoiceOrderProcessor();
