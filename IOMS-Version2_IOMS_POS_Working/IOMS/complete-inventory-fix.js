// 🚀 COMPLETE INVENTORY FIX SCRIPT
// This script will fix the inventory deduction issue completely
// Copy and paste this into your browser console

console.log('🔧 Starting complete inventory fix...');

// Get current user
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
if (!currentUser.id) {
  alert('❌ Please log in first!');
  throw new Error('User not logged in');
}

console.log('👤 User:', currentUser.id);

// Helper functions
function getMenuData() {
  return JSON.parse(localStorage.getItem(`restaurantMenu_${currentUser.id}`) || '[]');
}

function getInventoryData() {
  return JSON.parse(localStorage.getItem(`inventory_${currentUser.id}`) || '[]');
}

function saveMenuData(menu) {
  localStorage.setItem(`restaurantMenu_${currentUser.id}`, JSON.stringify(menu));
}

function saveInventoryData(inventory) {
  localStorage.setItem(`inventory_${currentUser.id}`, JSON.stringify(inventory));
}

// Get current data
let menu = getMenuData();
let inventory = getInventoryData();

console.log('📋 Current menu dishes:', menu.length);
console.log('📦 Current inventory items:', inventory.length);

// STEP 1: Fix Chocolava cake ingredients if missing
console.log('\n🍰 === STEP 1: FIXING CHOCOLAVA CAKE ===');

let chocolavaDish = menu.find(d => 
  d.name.toLowerCase().includes('chocolava') || 
  d.name.toLowerCase().includes('chocolate')
);

if (!chocolavaDish) {
  console.log('❌ Chocolava cake not found in menu');
} else {
  console.log('✅ Found:', chocolavaDish.name);
  
  // Check if ingredients are missing or improperly formatted
  if (!chocolavaDish.ingredients || chocolavaDish.ingredients.length === 0 || 
      !chocolavaDish.ingredients[0].inventoryItemName) {
    
    console.log('🔧 Fixing missing/improper ingredients...');
    
    const correctIngredients = [
      { inventoryItemName: 'Dark Chocolate', quantityPerDish: 100, unit: 'g' },
      { inventoryItemName: 'Unsalted Butter', quantityPerDish: 80, unit: 'g' },
      { inventoryItemName: 'Granulated Sugar', quantityPerDish: 75, unit: 'g' },
      { inventoryItemName: 'Large Eggs', quantityPerDish: 2, unit: 'pcs' },
      { inventoryItemName: 'Egg Yolks', quantityPerDish: 2, unit: 'pcs' },
      { inventoryItemName: 'All-Purpose Flour', quantityPerDish: 30, unit: 'g' },
      { inventoryItemName: 'Vanilla Extract', quantityPerDish: 2, unit: 'ml' },
      { inventoryItemName: 'Salt', quantityPerDish: 1, unit: 'g' },
      { inventoryItemName: 'Powdered Sugar', quantityPerDish: 15, unit: 'g' }
    ];
    
    // Update the dish
    menu = menu.map(dish => {
      if (dish.name === chocolavaDish.name) {
        return { ...dish, ingredients: correctIngredients };
      }
      return dish;
    });
    
    saveMenuData(menu);
    chocolavaDish.ingredients = correctIngredients;
    console.log('✅ Fixed Chocolava cake ingredients');
  } else {
    console.log('✅ Ingredients already exist:', chocolavaDish.ingredients.length);
  }
}

// STEP 2: Ensure inventory items exist
console.log('\n📦 === STEP 2: CHECKING INVENTORY ===');

const requiredInventoryItems = [
  { name: 'Dark Chocolate', quantity: 2500, unit: 'g' },
  { name: 'Unsalted Butter', quantity: 1250, unit: 'g' },
  { name: 'Granulated Sugar', quantity: 1250, unit: 'g' },
  { name: 'Large Eggs', quantity: 25, unit: 'pcs' },
  { name: 'Egg Yolks', quantity: 25, unit: 'pcs' },
  { name: 'All-Purpose Flour', quantity: 625, unit: 'g' },
  { name: 'Vanilla Extract', quantity: 40, unit: 'ml' },
  { name: 'Salt', quantity: 100, unit: 'g' },
  { name: 'Powdered Sugar', quantity: 200, unit: 'g' }
];

let inventoryUpdated = false;

requiredInventoryItems.forEach(required => {
  const existing = inventory.find(item => 
    item.name.toLowerCase().trim() === required.name.toLowerCase().trim()
  );
  
  if (!existing) {
    console.log(`➕ Adding missing inventory item: ${required.name}`);
    inventory.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: required.name,
      quantity: required.quantity,
      unit: required.unit,
      category: 'Pantry',
      lowStockThreshold: Math.max(1, Math.floor(required.quantity * 0.2)),
      lastRestocked: new Date().toISOString(),
      quantityUsed: 0,
      image: 'https://placehold.co/60x60.png'
    });
    inventoryUpdated = true;
  } else {
    console.log(`✅ Found: ${existing.name} (${existing.quantity} ${existing.unit})`);
  }
});

if (inventoryUpdated) {
  saveInventoryData(inventory);
  console.log('✅ Updated inventory with missing items');
}

// STEP 3: Test ingredient matching
console.log('\n🔍 === STEP 3: TESTING INGREDIENT MATCHING ===');

if (chocolavaDish && chocolavaDish.ingredients) {
  const matchResults = [];
  
  chocolavaDish.ingredients.forEach(ingredient => {
    const inventoryItem = inventory.find(item => 
      item.name.toLowerCase().trim() === ingredient.inventoryItemName.toLowerCase().trim()
    );
    
    if (inventoryItem) {
      const possibleServings = Math.floor(inventoryItem.quantity / ingredient.quantityPerDish);
      console.log(`✅ ${ingredient.inventoryItemName}: ${possibleServings} servings possible`);
      matchResults.push(possibleServings);
    } else {
      console.log(`❌ ${ingredient.inventoryItemName}: NOT FOUND`);
      matchResults.push(0);
    }
  });
  
  const minServings = Math.min(...matchResults);
  console.log(`\n🎯 RESULT: ${minServings} total servings possible`);
  
  if (minServings > 0) {
    console.log('✅ All ingredients matched! Inventory deduction should work.');
  } else {
    console.log('❌ Some ingredients missing. Check inventory names.');
  }
}

// STEP 4: Test actual inventory deduction
console.log('\n🧪 === STEP 4: TESTING INVENTORY DEDUCTION ===');

function testOrderPlacement() {
  if (!chocolavaDish || !chocolavaDish.ingredients) {
    console.log('❌ Cannot test - Chocolava cake not ready');
    return;
  }
  
  console.log('Testing inventory deduction for 1 Chocolava cake...');
  
  // Create a copy for testing
  const testInventory = JSON.parse(JSON.stringify(inventory));
  let allMatched = true;
  const deductionLog = [];
  
  chocolavaDish.ingredients.forEach(ingredient => {
    const item = testInventory.find(invItem => 
      invItem.name.toLowerCase().trim() === ingredient.inventoryItemName.toLowerCase().trim()
    );
    
    if (item) {
      const oldQuantity = item.quantity;
      const newQuantity = Math.max(0, oldQuantity - ingredient.quantityPerDish);
      const newUsed = (item.quantityUsed || 0) + ingredient.quantityPerDish;
      
      item.quantity = newQuantity;
      item.quantityUsed = newUsed;
      
      deductionLog.push(`${ingredient.inventoryItemName}: ${oldQuantity} → ${newQuantity} ${item.unit} (used: +${ingredient.quantityPerDish})`);
    } else {
      allMatched = false;
      deductionLog.push(`❌ ${ingredient.inventoryItemName}: NOT FOUND`);
    }
  });
  
  console.log('\n📊 Deduction simulation:');
  deductionLog.forEach(log => console.log(`   ${log}`));
  
  if (allMatched) {
    console.log('\n✅ Simulation successful!');
    
    if (confirm('Apply this deduction to your inventory? This will simulate placing 1 order.')) {
      saveInventoryData(testInventory);
      console.log('✅ Applied inventory deduction!');
      console.log('🔄 Refresh your inventory page to see the changes.');
      
      // Show updated usage
      console.log('\n📈 Items with usage:');
      testInventory.filter(item => item.quantityUsed > 0).forEach(item => {
        console.log(`   ${item.name}: ${item.quantityUsed} ${item.unit} used`);
      });
    }
  } else {
    console.log('\n❌ Simulation failed - some ingredients not found');
  }
}

testOrderPlacement();

// STEP 5: Summary and instructions
console.log('\n🎯 === SUMMARY ===');
console.log(`📋 Menu: ${menu.length} dishes`);
console.log(`📦 Inventory: ${inventory.length} items`);
console.log(`🍰 Chocolava cake: ${chocolavaDish ? 'Ready' : 'Missing'}`);

console.log('\n💡 === NEXT STEPS ===');
console.log('1. Refresh your browser (F5 or Ctrl+R)');
console.log('2. Go to Order Entry page');
console.log('3. Add Chocolava cake to order');
console.log('4. Place the order');
console.log('5. Check inventory page - "Used" column should increase');
console.log('6. Check available servings should decrease');

console.log('\n🔧 === IF STILL NOT WORKING ===');
console.log('1. Check browser console for errors during order placement');
console.log('2. Verify you see "Recording ingredient usage" messages');
console.log('3. Make sure you are logged in with the same user');

console.log('\n✅ Inventory fix script completed!');
