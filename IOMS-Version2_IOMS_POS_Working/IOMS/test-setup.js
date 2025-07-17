// 🚀 QUICK SETUP SCRIPT FOR SMART INVENTORY TESTING
// Copy and paste this into your browser console to set up test data

console.log('🧪 Setting up Smart Inventory Test Environment...');

// Get current user
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
if (!currentUser.id) {
  alert('❌ Please log in first!');
  throw new Error('User not logged in');
}

console.log('👤 Setting up for user:', currentUser.id);

// Helper functions
function getInventoryKey() { return `inventory_${currentUser.id}`; }
function getMenuKey() { return `restaurantMenu_${currentUser.id}`; }

function saveInventory(inventory) {
  localStorage.setItem(getInventoryKey(), JSON.stringify(inventory));
}

function saveMenu(menu) {
  localStorage.setItem(getMenuKey(), JSON.stringify(menu));
}

// Clear existing data
console.log('🧹 Clearing existing data...');
localStorage.removeItem(getInventoryKey());
localStorage.removeItem(getMenuKey());

// Create test inventory (partial - some ingredients missing intentionally)
console.log('📦 Creating test inventory...');
const testInventory = [
  {
    id: 'inv_1',
    name: 'Basmati Rice',
    quantity: 5000,
    unit: 'g',
    category: 'Grains',
    lowStockThreshold: 500,
    lastRestocked: new Date().toISOString(),
    quantityUsed: 0,
    image: 'https://placehold.co/60x60.png',
    aiHint: 'long grain rice'
  },
  {
    id: 'inv_2', 
    name: 'Chicken',
    quantity: 2000,
    unit: 'g',
    category: 'Meat',
    lowStockThreshold: 200,
    lastRestocked: new Date().toISOString(),
    quantityUsed: 0,
    image: 'https://placehold.co/60x60.png',
    aiHint: 'chicken breast'
  },
  {
    id: 'inv_3',
    name: 'Onions',
    quantity: 1000,
    unit: 'g', 
    category: 'Produce',
    lowStockThreshold: 100,
    lastRestocked: new Date().toISOString(),
    quantityUsed: 0,
    image: 'https://placehold.co/60x60.png',
    aiHint: 'yellow onions'
  },
  {
    id: 'inv_4',
    name: 'Yogurt',
    quantity: 500,
    unit: 'ml',
    category: 'Dairy',
    lowStockThreshold: 50,
    lastRestocked: new Date().toISOString(),
    quantityUsed: 0,
    image: 'https://placehold.co/60x60.png',
    aiHint: 'plain yogurt'
  },
  {
    id: 'inv_5',
    name: 'Salt',
    quantity: 100,
    unit: 'g',
    category: 'Spices',
    lowStockThreshold: 10,
    lastRestocked: new Date().toISOString(),
    quantityUsed: 0,
    image: 'https://placehold.co/60x60.png',
    aiHint: 'table salt'
  }
];

// Deliberately missing ingredients for testing auto-add:
// - Ginger Garlic Paste
// - Green Chilies  
// - Red Chili Powder
// - Turmeric Powder
// - Garam Masala

saveInventory(testInventory);
console.log('✅ Test inventory created with 5 items');

// Create test menu with Chicken Biryani
console.log('🍽️ Creating test menu...');
const testMenu = [
  {
    id: 'dish_1',
    name: 'Chicken Biryani',
    category: 'Main Course',
    price: 15.99,
    image: 'https://placehold.co/100x100.png',
    aiHint: 'spicy chicken biryani with basmati rice',
    ingredients: [
      { inventoryItemName: 'Basmati Rice', quantityPerDish: 200, unit: 'g' },
      { inventoryItemName: 'Chicken', quantityPerDish: 150, unit: 'g' },
      { inventoryItemName: 'Onions', quantityPerDish: 50, unit: 'g' },
      { inventoryItemName: 'Ginger Garlic Paste', quantityPerDish: 10, unit: 'g' },
      { inventoryItemName: 'Green Chilies', quantityPerDish: 5, unit: 'g' },
      { inventoryItemName: 'Yogurt', quantityPerDish: 30, unit: 'ml' },
      { inventoryItemName: 'Red Chili Powder', quantityPerDish: 2, unit: 'g' },
      { inventoryItemName: 'Turmeric Powder', quantityPerDish: 1, unit: 'g' },
      { inventoryItemName: 'Garam Masala', quantityPerDish: 2, unit: 'g' },
      { inventoryItemName: 'Salt', quantityPerDish: 1, unit: 'g' }
    ]
  },
  {
    id: 'dish_2',
    name: 'Vegetable Curry',
    category: 'Main Course', 
    price: 12.99,
    image: 'https://placehold.co/100x100.png',
    aiHint: 'mixed vegetable curry',
    ingredients: [
      { inventoryItemName: 'Onions', quantityPerDish: 80, unit: 'g' },
      { inventoryItemName: 'Tomatoes', quantityPerDish: 100, unit: 'g' },
      { inventoryItemName: 'Potatoes', quantityPerDish: 120, unit: 'g' },
      { inventoryItemName: 'Green Chilies', quantityPerDish: 3, unit: 'g' },
      { inventoryItemName: 'Ginger Garlic Paste', quantityPerDish: 8, unit: 'g' },
      { inventoryItemName: 'Turmeric Powder', quantityPerDish: 1, unit: 'g' },
      { inventoryItemName: 'Red Chili Powder', quantityPerDish: 2, unit: 'g' },
      { inventoryItemName: 'Salt', quantityPerDish: 1, unit: 'g' }
    ]
  },
  {
    id: 'dish_3',
    name: 'Plain Rice',
    category: 'Sides',
    price: 4.99,
    image: 'https://placehold.co/100x100.png', 
    aiHint: 'steamed basmati rice',
    ingredients: [
      { inventoryItemName: 'Basmati Rice', quantityPerDish: 150, unit: 'g' },
      { inventoryItemName: 'Salt', quantityPerDish: 0.5, unit: 'g' }
    ]
  }
];

saveMenu(testMenu);
console.log('✅ Test menu created with 3 dishes');

console.log('\n🧪 CHICKEN BIRYANI ANALYSIS:');
console.log('   Available ingredients: 5/10');
console.log('   ✅ Available: Basmati Rice, Chicken, Onions, Yogurt, Salt');
console.log('   ❌ Missing: Ginger Garlic Paste, Green Chilies, Red Chili Powder, Turmeric Powder, Garam Masala');
console.log('   🎯 Possible servings (based on current inventory):');
console.log('     - Basmati Rice: 5000÷200 = 25 servings');
console.log('     - Chicken: 2000÷150 = 13 servings'); 
console.log('     - Onions: 1000÷50 = 20 servings');
console.log('     - Yogurt: 500÷30 = 16 servings');
console.log('     - Salt: 100÷1 = 100 servings');
console.log('     ➡️ MINIMUM: 13 servings (limited by Chicken)');

console.log('\n🥗 VEGETABLE CURRY ANALYSIS:');
console.log('   Available ingredients: 2/8'); 
console.log('   ✅ Available: Onions, Salt');
console.log('   ❌ Missing: Tomatoes, Potatoes + 4 spices'); 

console.log('\n🍚 PLAIN RICE ANALYSIS:');
console.log('   Available ingredients: 2/2');
console.log('   ✅ Fully available! Can make 33 servings');

console.log('\n🎯 TEST STEPS:');
console.log('1. 🔄 Refresh your browser');
console.log('2. 📋 Go to Menu Upload page');
console.log('3. 🔍 Click "Check Inventory" button');
console.log('4. 📊 Verify analysis matches expected results above');
console.log('5. ➕ Click "Auto-Add X Ingredients" button');  
console.log('6. ✅ Verify missing ingredients are added to inventory');
console.log('7. 🍽️ Go to Order Entry and place test orders');
console.log('8. 📦 Check inventory deduction after orders');

console.log('\n🧪 TESTING SCENARIOS:');
console.log('• Test Case 1: Chicken Biryani should show mixed availability');
console.log('• Test Case 2: Auto-add should create 8 missing ingredients'); 
console.log('• Test Case 3: After auto-add, all dishes should be available');
console.log('• Test Case 4: Order placement should deduct correct amounts');
console.log('• Test Case 5: Multiple orders should scale deductions');

console.log('\n✅ TEST ENVIRONMENT READY!');
console.log('🔄 Please refresh your browser and start testing.');

// Provide quick verification
if (confirm('✅ Test environment created! Would you like to verify the setup?')) {
  console.log('\n🔍 VERIFICATION:');
  const savedInventory = JSON.parse(localStorage.getItem(getInventoryKey()) || '[]');
  const savedMenu = JSON.parse(localStorage.getItem(getMenuKey()) || '[]');
  
  console.log(`📦 Inventory items: ${savedInventory.length}`);
  console.log(`🍽️ Menu dishes: ${savedMenu.length}`);
  console.log('✅ All data successfully saved!');
}
