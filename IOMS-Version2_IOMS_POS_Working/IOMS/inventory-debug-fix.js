// 🔧 COMPREHENSIVE INVENTORY DEBUG & FIX SCRIPT
// Copy and paste this into your browser console to debug and fix inventory issues

console.log('🚀 Starting comprehensive inventory debug...');

// Get current user (assuming you're logged in)
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
if (!currentUser.id) {
  console.log('❌ No user found. Please make sure you are logged in.');
  throw new Error('User not logged in');
}

console.log('👤 Current user:', currentUser.id);

// Get current menu and inventory
function getMenuData() {
  const menuKey = `restaurantMenu_${currentUser.id}`;
  return JSON.parse(localStorage.getItem(menuKey) || '[]');
}

function getInventoryData() {
  const inventoryKey = `inventory_${currentUser.id}`;
  return JSON.parse(localStorage.getItem(inventoryKey) || '[]');
}

function saveInventoryData(inventory) {
  const inventoryKey = `inventory_${currentUser.id}`;
  localStorage.setItem(inventoryKey, JSON.stringify(inventory));
}

const menu = getMenuData();
const inventory = getInventoryData();

console.log('📋 Menu dishes:', menu.length);
console.log('📦 Inventory items:', inventory.length);

// Find Chocolava cake
const chocolavaDish = menu.find(d => 
  d.name.toLowerCase().includes('chocolava') || 
  d.name.toLowerCase().includes('chocolate')
);

if (!chocolavaDish) {
  console.log('❌ Chocolava cake not found in menu');
  console.log('Available dishes:', menu.map(d => d.name));
  throw new Error('Chocolava cake not found');
}

console.log('🍰 Found dish:', chocolavaDish.name);
console.log('🥘 Dish ingredients:', chocolavaDish.ingredients);

// Debug ingredient matching
console.log('\n🔍 ===== INGREDIENT MATCHING ANALYSIS =====');

if (!chocolavaDish.ingredients || chocolavaDish.ingredients.length === 0) {
  console.log('❌ No ingredients found for Chocolava cake!');
  
  // Let's fix this by adding proper ingredients
  const properIngredients = [
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
  
  console.log('🔧 Adding proper ingredients to Chocolava cake...');
  
  // Update the dish
  const updatedMenu = menu.map(dish => {
    if (dish.name === chocolavaDish.name) {
      return { ...dish, ingredients: properIngredients };
    }
    return dish;
  });
  
  // Save updated menu
  const menuKey = `restaurantMenu_${currentUser.id}`;
  localStorage.setItem(menuKey, JSON.stringify(updatedMenu));
  
  console.log('✅ Updated Chocolava cake with proper ingredients');
  chocolavaDish.ingredients = properIngredients;
}

// Now check each ingredient against inventory
console.log('\n📋 Checking each ingredient against inventory:');

const missingIngredients = [];
const foundIngredients = [];

chocolavaDish.ingredients.forEach((ingredient, index) => {
  console.log(`\n${index + 1}. Checking: "${ingredient.inventoryItemName}"`);
  
  // Find exact match
  let inventoryItem = inventory.find(item => 
    item.name.toLowerCase().trim() === ingredient.inventoryItemName.toLowerCase().trim()
  );
  
  if (inventoryItem) {
    console.log(`   ✅ EXACT MATCH: ${inventoryItem.name} (${inventoryItem.quantity} ${inventoryItem.unit})`);
    console.log(`   📊 Need: ${ingredient.quantityPerDish} ${ingredient.unit} | Available: ${inventoryItem.quantity} ${inventoryItem.unit}`);
    
    foundIngredients.push({
      ingredient: ingredient.inventoryItemName,
      needed: ingredient.quantityPerDish,
      available: inventoryItem.quantity,
      unit: inventoryItem.unit,
      possibleServings: Math.floor(inventoryItem.quantity / ingredient.quantityPerDish)
    });
  } else {
    console.log(`   ❌ NOT FOUND: ${ingredient.inventoryItemName}`);
    console.log('   🔍 Similar items in inventory:');
    
    // Look for similar items
    const similar = inventory.filter(item => {
      const itemName = item.name.toLowerCase();
      const searchName = ingredient.inventoryItemName.toLowerCase();
      return itemName.includes(searchName.split(' ')[0]) || searchName.includes(itemName.split(' ')[0]);
    });
    
    similar.forEach(item => {
      console.log(`      📦 ${item.name} (${item.quantity} ${item.unit})`);
    });
    
    missingIngredients.push(ingredient.inventoryItemName);
  }
});

// Calculate total possible servings
if (foundIngredients.length > 0) {
  const minServings = Math.min(...foundIngredients.map(ing => ing.possibleServings));
  console.log(`\n🎯 SERVINGS CALCULATION:`);
  console.log(`   Minimum possible servings: ${minServings}`);
  
  foundIngredients.forEach(ing => {
    console.log(`   ${ing.ingredient}: ${ing.possibleServings} servings (${ing.available}÷${ing.needed})`);
  });
} else {
  console.log('\n❌ No matching ingredients found!');
}

if (missingIngredients.length > 0) {
  console.log('\n❌ Missing ingredients:', missingIngredients);
}

// Test inventory deduction simulation
console.log('\n🧪 ===== INVENTORY DEDUCTION TEST =====');

function testInventoryDeduction() {
  console.log('Testing inventory deduction for 1 serving of Chocolava cake...');
  
  const testInventory = JSON.parse(JSON.stringify(inventory)); // Deep copy
  let deductionSuccess = true;
  const deductionLog = [];
  
  chocolavaDish.ingredients.forEach(ingredient => {
    const inventoryItem = testInventory.find(item => 
      item.name.toLowerCase().trim() === ingredient.inventoryItemName.toLowerCase().trim()
    );
    
    if (inventoryItem) {
      const oldQuantity = inventoryItem.quantity;
      const newQuantity = Math.max(0, oldQuantity - ingredient.quantityPerDish);
      const newQuantityUsed = (inventoryItem.quantityUsed || 0) + ingredient.quantityPerDish;
      
      inventoryItem.quantity = newQuantity;
      inventoryItem.quantityUsed = newQuantityUsed;
      
      deductionLog.push(`${ingredient.inventoryItemName}: ${oldQuantity} → ${newQuantity} ${inventoryItem.unit} (used: +${ingredient.quantityPerDish})`);
    } else {
      deductionSuccess = false;
      deductionLog.push(`❌ ${ingredient.inventoryItemName}: NOT FOUND`);
    }
  });
  
  console.log('📊 Deduction results:');
  deductionLog.forEach(log => console.log(`   ${log}`));
  
  if (deductionSuccess) {
    console.log('\n✅ Deduction test successful! All ingredients found and deducted.');
    
    // Ask if user wants to apply this test deduction
    if (confirm('Would you like to apply this test deduction to your actual inventory?')) {
      saveInventoryData(testInventory);
      console.log('✅ Applied inventory deduction! Refresh your inventory page to see changes.');
      
      // Also show the updated inventory usage
      console.log('\n📈 Updated inventory usage:');
      testInventory.filter(item => item.quantityUsed > 0).forEach(item => {
        console.log(`   ${item.name}: ${item.quantityUsed} ${item.unit} used`);
      });
    }
  } else {
    console.log('\n❌ Deduction test failed! Some ingredients not found.');
  }
}

testInventoryDeduction();

console.log('\n🎯 ===== SUMMARY =====');
console.log(`📋 Menu dishes: ${menu.length}`);
console.log(`📦 Inventory items: ${inventory.length}`);
console.log(`🍰 Chocolava ingredients: ${chocolavaDish.ingredients.length}`);
console.log(`✅ Found ingredients: ${foundIngredients.length}`);
console.log(`❌ Missing ingredients: ${missingIngredients.length}`);

if (missingIngredients.length === 0) {
  console.log('\n🎉 ALL INGREDIENTS FOUND! Inventory deduction should work correctly.');
} else {
  console.log('\n⚠️ Some ingredients are missing. Check ingredient names match exactly between menu and inventory.');
}

console.log('\n💡 Next steps:');
console.log('1. Refresh your inventory page to see any changes');
console.log('2. Try placing an order for Chocolava cake');
console.log('3. Check that inventory quantities decrease and "Used" column increases');
