/**
 * Test server-side menu service
 */

const { getServerSideDishes } = require('./src/lib/serverMenuService');

async function testServerMenu() {
  console.log('🧪 Testing Server-Side Menu Service...\n');
  
  try {
    const dishes = getServerSideDishes('test-user');
    
    console.log('✅ Server Menu Service Result:');
    console.log(`Found ${dishes.length} dishes`);
    
    if (dishes.length > 0) {
      console.log('\n📋 Available dishes:');
      dishes.forEach((dish, index) => {
        console.log(`${index + 1}. ${dish.name} - $${dish.price}`);
      });
      
      // Check for samosa items
      const samosaItems = dishes.filter(dish => 
        dish.name.toLowerCase().includes('samosa')
      );
      
      console.log(`\n🥟 Found ${samosaItems.length} samosa items:`);
      samosaItems.forEach(dish => {
        console.log(`- ${dish.name} - $${dish.price}`);
      });
      
      if (samosaItems.length > 0) {
        console.log('\n🎉 SUCCESS: Menu service can find samosa items!');
      } else {
        console.log('\n⚠️  WARNING: No samosa items found in menu');
      }
    } else {
      console.log('\n❌ FAILED: No dishes found');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testServerMenu();
