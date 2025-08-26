// 🔧 DEBUG SCRIPT: Test Smart Inventory Analysis
// Copy and paste this into your browser console to debug the inventory analysis

console.log('🔧 Starting Smart Inventory Analysis Debug...');

// Get current user
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
if (!currentUser.id) {
  alert('❌ Please log in first!');
  throw new Error('User not logged in');
}

console.log('👤 User:', currentUser.id);

// Get current menu and inventory
function getMenuData() {
  return JSON.parse(localStorage.getItem(`restaurantMenu_${currentUser.id}`) || '[]');
}

function getInventoryData() {
  return JSON.parse(localStorage.getItem(`inventory_${currentUser.id}`) || '[]');
}

const menu = getMenuData();
const inventory = getInventoryData();

console.log('📋 Current menu:', menu.length, 'dishes');
console.log('📦 Current inventory:', inventory.length, 'items');

if (menu.length === 0) {
  console.log('❌ No menu found. Please upload a menu first.');
  throw new Error('No menu available');
}

if (inventory.length === 0) {
  console.log('⚠️ No inventory found. Creating some test inventory...');
  
  // Create basic inventory for testing
  const testInventory = [
    { id: 'inv_1', name: 'Basmati Rice', quantity: 2000, unit: 'g', category: 'Grains', quantityUsed: 0 },
    { id: 'inv_2', name: 'Chicken Breast', quantity: 1500, unit: 'g', category: 'Meat', quantityUsed: 0 },
    { id: 'inv_3', name: 'Onions', quantity: 800, unit: 'g', category: 'Produce', quantityUsed: 0 },
    { id: 'inv_4', name: 'Tomatoes', quantity: 600, unit: 'g', category: 'Produce', quantityUsed: 0 },
    { id: 'inv_5', name: 'Olive Oil', quantity: 500, unit: 'ml', category: 'Oils', quantityUsed: 0 }
  ];
  
  localStorage.setItem(`inventory_${currentUser.id}`, JSON.stringify(testInventory));
  console.log('✅ Created test inventory with 5 items');
}

// Test the analysis function
console.log('\n🧪 Testing Smart Inventory Analysis...');

// Check current dishes and their ingredients
console.log('\n📋 CURRENT MENU ANALYSIS:');
menu.forEach((dish, index) => {
  console.log(`\n${index + 1}. ${dish.name}:`);
  console.log('   Category:', dish.category);
  console.log('   Price:', dish.price);
  console.log('   Ingredients:', dish.ingredients);
  
  if (dish.ingredients && Array.isArray(dish.ingredients)) {
    console.log(`   Ingredients count: ${dish.ingredients.length}`);
    console.log('   Ingredient format check:');
    dish.ingredients.forEach((ing, i) => {
      console.log(`      ${i + 1}. ${typeof ing === 'string' ? ing : JSON.stringify(ing)}`);
    });
  } else {
    console.log('   ⚠️ No ingredients or invalid format');
  }
});

// Try to format ingredients properly
console.log('\n🔄 FORMATTING INGREDIENTS...');

const formattedMenu = menu.map(dish => {
  if (!dish.ingredients || !Array.isArray(dish.ingredients)) {
    return { ...dish, ingredients: [] };
  }
  
  const formattedIngredients = dish.ingredients.map(ing => {
    if (typeof ing === 'object' && ing.inventoryItemName) {
      return ing; // Already correct format
    } else if (typeof ing === 'object' && ing.name) {
      return {
        inventoryItemName: ing.name,
        quantityPerDish: parseFloat(ing.quantity) || 100,
        unit: ing.unit || 'g'
      };
    } else if (typeof ing === 'string') {
      return {
        inventoryItemName: ing,
        quantityPerDish: 100,
        unit: 'g'
      };
    } else {
      return {
        inventoryItemName: String(ing),
        quantityPerDish: 100,
        unit: 'g'
      };
    }
  });
  
  console.log(`✅ Formatted ${dish.name}:`, formattedIngredients);
  return { ...dish, ingredients: formattedIngredients };
});

// Test analysis
console.log('\n🧠 RUNNING ANALYSIS...');

try {
  // Simple test without importing the service
  const inventory = getInventoryData();
  console.log('📦 Available inventory:', inventory.map(item => `${item.name} (${item.quantity} ${item.unit})`));
  
  formattedMenu.forEach(dish => {
    if (!dish.ingredients || dish.ingredients.length === 0) {
      console.log(`⚠️ ${dish.name}: No ingredients to analyze`);
      return;
    }
    
    console.log(`\n🔍 Analyzing ${dish.name}:`);
    
    let availableCount = 0;
    let missingCount = 0;
    
    dish.ingredients.forEach(ingredient => {
      const inventoryItem = inventory.find(item => 
        item.name.toLowerCase().trim() === ingredient.inventoryItemName.toLowerCase().trim()
      );
      
      if (inventoryItem) {
        const possibleServings = Math.floor(inventoryItem.quantity / ingredient.quantityPerDish);
        console.log(`   ✅ ${ingredient.inventoryItemName}: ${possibleServings} servings possible (${inventoryItem.quantity}÷${ingredient.quantityPerDish})`);
        availableCount++;
      } else {
        console.log(`   ❌ ${ingredient.inventoryItemName}: Missing from inventory`);
        missingCount++;
      }
    });
    
    console.log(`   📊 Summary: ${availableCount}/${dish.ingredients.length} ingredients available`);
  });
  
  console.log('\n✅ Manual analysis completed successfully!');
  console.log('\n💡 If this worked, the issue might be in the import or function call.');
  console.log('💡 Try clicking "Check Inventory" again - it should work now.');
  
} catch (error) {
  console.error('❌ Analysis failed:', error);
  console.error('❌ Error details:', error.message);
}

console.log('\n🎯 RECOMMENDATIONS:');
console.log('1. Refresh your browser page');
console.log('2. Try clicking "Check Inventory" button again');
console.log('3. Check browser console for any additional errors');
console.log('4. If still failing, check that smartInventoryService.ts is properly imported');

console.log('\n✅ Debug script completed!');
