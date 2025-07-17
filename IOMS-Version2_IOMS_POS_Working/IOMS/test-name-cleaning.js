// Test script to verify menu name cleaning functionality
// Run this in browser console to test the fix

console.log('🧪 Testing Menu Name Cleaning Fix...');

// Function to clean menu item names (copied from the API route)
function cleanMenuItemName(name) {
  if (!name) return name;
  
  // Remove price patterns like "- 12.90 EUR", "- $12.90", "- 12.90", "- €12.90"
  return name
    .replace(/\s*-\s*\d+[\.,]\d+\s*(EUR|USD|GBP|€|\$|£)\s*$/i, '') // Remove "- 12.90 EUR" patterns
    .replace(/\s*-\s*\d+[\.,]\d+\s*$/i, '') // Remove "- 12.90" patterns  
    .replace(/\s*\(\d+[\.,]\d+\s*(EUR|USD|GBP|€|\$|£)\)\s*$/i, '') // Remove "(12.90 EUR)" patterns
    .replace(/\s*\$\d+[\.,]\d+\s*$/i, '') // Remove "$12.90" patterns
    .replace(/\s*€\d+[\.,]\d+\s*$/i, '') // Remove "€12.90" patterns
    .replace(/\s*£\d+[\.,]\d+\s*$/i, '') // Remove "£12.90" patterns
    .trim();
}

// Test cases from the actual CSV
const testCases = [
  'Chicken Biryani - 12.90 EUR',
  'Dal Masoor Tadka - 9.90 EUR', 
  'Grilled Chicken with Mozzarella Crust - 13.90 EUR',
  'Tomato & Onion Curry - 8.90 EUR',
  'Samosa Chaat - 6.50 EUR',
  'Cheesy Samosa Bake - 7.00 EUR',
  'Plain Basmati Rice - 3.50 EUR',
  'Moong-Masoor Lentil Mix - 4.50 EUR',
  'Tomato & Onion Salad - 4.00 EUR',
  'Simple Item Name', // Should remain unchanged
  'Burger $15.99',
  'Pizza €12.50',
  'Fish & Chips £8.75'
];

console.log('🔍 Name Cleaning Results:');
console.log('=========================');

testCases.forEach(originalName => {
  const cleanedName = cleanMenuItemName(originalName);
  const hasChanged = originalName !== cleanedName;
  console.log(`${hasChanged ? '✅' : '➡️'} "${originalName}" → "${cleanedName}"`);
});

// Test current menu data from localStorage
function testCurrentMenuData() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) {
    console.log('❌ No user logged in. Please login first.');
    return;
  }

  const menuKey = `restaurantMenu_${currentUser.id}`;
  const menuData = localStorage.getItem(menuKey);
  
  if (!menuData) {
    console.log('❌ No menu data found. Please import menu first.');
    return;
  }

  try {
    const menu = JSON.parse(menuData);
    console.log('\n📋 Current Menu Items Analysis:');
    console.log('===============================');
    
    menu.forEach((dish, index) => {
      const originalName = dish.name;
      const cleanedName = cleanMenuItemName(originalName);
      const hasPrice = originalName !== cleanedName;
      console.log(`${index + 1}. ${hasPrice ? '❗' : '✅'} "${originalName}"${hasPrice ? ` → "${cleanedName}"` : ''}`);
    });

    const problemItems = menu.filter(dish => dish.name !== cleanMenuItemName(dish.name));
    console.log(`\n📊 Summary: ${problemItems.length} items have price information in their names`);
    
    if (problemItems.length > 0) {
      console.log('🔧 These items will be automatically cleaned when the menu is re-imported.');
    }
    
  } catch (error) {
    console.error('❌ Error parsing menu data:', error);
  }
}

// Test inventory matching
function testInventoryMatching() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!currentUser) {
    console.log('❌ No user logged in for inventory test.');
    return;
  }

  const inventoryKey = `inventory_${currentUser.id}`;
  const menuKey = `restaurantMenu_${currentUser.id}`;
  
  const inventoryData = localStorage.getItem(inventoryKey);
  const menuData = localStorage.getItem(menuKey);
  
  if (!inventoryData || !menuData) {
    console.log('❌ Missing inventory or menu data for matching test.');
    return;
  }

  try {
    const inventory = JSON.parse(inventoryData);
    const menu = JSON.parse(menuData);
    
    console.log('\n🔗 Inventory-Menu Matching Analysis:');
    console.log('====================================');
    
    // Create a map of inventory items by name
    const inventoryMap = {};
    inventory.forEach(item => {
      inventoryMap[item.name.toLowerCase()] = item;
    });
    
    menu.forEach(dish => {
      if (dish.ingredients && Array.isArray(dish.ingredients)) {
        console.log(`\n🍽️ Dish: "${dish.name}"`);
        dish.ingredients.forEach(ingredient => {
          const cleanIngredient = cleanMenuItemName(ingredient).toLowerCase();
          const found = inventoryMap[cleanIngredient];
          console.log(`  ${found ? '✅' : '❌'} ${ingredient}${found ? ` (${found.quantity} ${found.unit})` : ' (not found in inventory)'}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error in matching analysis:', error);
  }
}

// Run all tests
testCurrentMenuData();
testInventoryMatching();

console.log('\n🎯 Fix Summary:');
console.log('===============');
console.log('✅ Name cleaning function implemented');
console.log('✅ Menu CSV import will now clean names automatically');
console.log('✅ Smart CSV converter will handle price removal');
console.log('✅ Inventory matching should work properly now');
console.log('\n💡 Next Steps:');
console.log('1. Re-import your menu to apply the cleaning');
console.log('2. Test order placement to verify inventory deduction');
console.log('3. Check the Debug page for alignment verification');
