// Complete Inventory Deduction Test Script
// Run this in browser console to test the entire workflow

console.log('🧪 === COMPREHENSIVE INVENTORY DEDUCTION TEST ===');

// Helper function to get current user
function getCurrentUser() {
  const auth = localStorage.getItem('auth');
  if (!auth) {
    console.error('❌ No auth found');
    return null;
  }
  return JSON.parse(auth).currentUser;
}

// Helper function to get menu dishes
function getMenuDishes(userId) {
  const menuKey = `restaurantMenu_${userId}`;
  const menuData = localStorage.getItem(menuKey);
  if (!menuData) {
    console.error('❌ No menu found');
    return [];
  }
  return JSON.parse(menuData);
}

// Helper function to get inventory
function getInventory(userId) {
  const inventoryKey = `inventory_${userId}`;
  const inventoryData = localStorage.getItem(inventoryKey);
  if (!inventoryData) {
    console.error('❌ No inventory found');
    return [];
  }
  return JSON.parse(inventoryData);
}

// Main test function
async function testInventoryDeduction() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  console.log('✅ User found:', currentUser.id);
  
  // Get menu and inventory
  const dishes = getMenuDishes(currentUser.id);
  const inventory = getInventory(currentUser.id);
  
  console.log(`📋 Found ${dishes.length} dishes`);
  console.log(`📦 Found ${inventory.length} inventory items`);
  
  // Find a dish with ingredients (preferably biryani)
  const testDish = dishes.find(d => 
    d.ingredients && 
    Array.isArray(d.ingredients) && 
    d.ingredients.length > 0 &&
    (d.name.toLowerCase().includes('biryani') || d.name.toLowerCase().includes('chicken'))
  ) || dishes.find(d => d.ingredients && Array.isArray(d.ingredients) && d.ingredients.length > 0);
  
  if (!testDish) {
    console.error('❌ No dish with ingredients found for testing');
    console.log('📋 Available dishes:', dishes.map(d => ({ name: d.name, hasIngredients: !!d.ingredients })));
    return;
  }
  
  console.log(`🍽️ Testing with dish: "${testDish.name}"`);
  console.log('🥘 Ingredients format:', testDish.ingredients);
  console.log('🥘 First ingredient:', testDish.ingredients[0]);
  console.log('🥘 Ingredient type:', typeof testDish.ingredients[0]);
  
  // Check ingredient format
  if (typeof testDish.ingredients[0] === 'string') {
    console.log('🚨 ISSUE: Ingredients are in string format!');
    console.log('🔧 Expected format: {inventoryItemName, quantityPerDish, unit}');
    console.log('🔧 Current format: ["ingredient1", "ingredient2", ...]');
    
    // Suggest solution
    console.log('💡 SOLUTION: Re-generate ingredients using "Generate All Ingredients" button');
    console.log('💡 This will convert them to proper format with quantities');
    return;
  }
  
  // Check if ingredients have proper format
  const hasProperFormat = testDish.ingredients.every(ing => 
    typeof ing === 'object' && 
    (ing.inventoryItemName || ing.name) && 
    (ing.quantityPerDish || ing.quantity) && 
    ing.unit
  );
  
  if (!hasProperFormat) {
    console.log('⚠️ Ingredients not in complete format');
    console.log('📋 Ingredient analysis:');
    testDish.ingredients.forEach((ing, i) => {
      console.log(`  ${i+1}. ${JSON.stringify(ing)}`);
    });
  } else {
    console.log('✅ Ingredients are in proper format!');
  }
  
  // Show inventory before deduction
  console.log('\n📦 INVENTORY BEFORE TEST DEDUCTION:');
  inventory.forEach(item => {
    console.log(`  ${item.name}: ${item.quantity} ${item.unit}`);
  });
  
  // Simulate order processing
  console.log(`\n🧾 SIMULATING ORDER: 2x ${testDish.name}`);
  console.log('🔄 This should deduct the following from inventory:');
  
  testDish.ingredients.forEach(ing => {
    const ingredientName = ing.inventoryItemName || ing.name;
    const quantityPerDish = ing.quantityPerDish || ing.quantity || 100;
    const unit = ing.unit || 'g';
    const totalNeeded = quantityPerDish * 2;
    
    console.log(`  ${ingredientName}: ${totalNeeded} ${unit} (${quantityPerDish} × 2)`);
    
    // Check if ingredient exists in inventory
    const inventoryItem = inventory.find(inv => 
      inv.name.toLowerCase() === ingredientName.toLowerCase() ||
      inv.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
      ingredientName.toLowerCase().includes(inv.name.toLowerCase())
    );
    
    if (inventoryItem) {
      console.log(`    ✅ Found in inventory: "${inventoryItem.name}" (${inventoryItem.quantity} ${inventoryItem.unit})`);
      if (inventoryItem.quantity >= totalNeeded) {
        console.log(`    ✅ Sufficient stock (${inventoryItem.quantity} >= ${totalNeeded})`);
      } else {
        console.log(`    ⚠️ Insufficient stock (${inventoryItem.quantity} < ${totalNeeded})`);
      }
    } else {
      console.log(`    ❌ NOT FOUND in inventory`);
      console.log(`    🔍 Similar items:`, inventory.filter(inv => 
        inv.name.toLowerCase().includes(ingredientName.split(' ')[0].toLowerCase())
      ).map(inv => inv.name));
    }
  });
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Go to menu upload page');
  console.log('2. Click "Generate All Ingredients" to ensure proper format');
  console.log('3. Save the menu');
  console.log('4. Go to order entry page');
  console.log('5. Place an order and check console for detailed deduction logs');
  console.log('6. Check inventory page to verify quantities were deducted');
}

// Run the test
testInventoryDeduction();

// Make functions available globally for interactive testing
window.testInventoryDeduction = testInventoryDeduction;
window.getCurrentUser = getCurrentUser;
window.getMenuDishes = getMenuDishes;
window.getInventory = getInventory;

console.log('\n🔧 Interactive testing functions available:');
console.log('  testInventoryDeduction() - Run full test');
console.log('  getCurrentUser() - Get current user');
console.log('  getMenuDishes(userId) - Get menu dishes');
console.log('  getInventory(userId) - Get inventory items');
