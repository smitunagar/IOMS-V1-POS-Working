// Debug Ingredient Deduction Script
// Run this in browser console to see exact ingredient formats and test deduction

console.log('🔍 === DEBUGGING INGREDIENT DEDUCTION ===');

// Get current user
const auth = localStorage.getItem('auth');
if (!auth) {
  console.error('❌ No auth found');
} else {
  const currentUser = JSON.parse(auth).currentUser;
  console.log('✅ User found:', currentUser.id);
  
  // Get menu dishes
  const menuKey = `restaurantMenu_${currentUser.id}`;
  const menuData = localStorage.getItem(menuKey);
  
  if (!menuData) {
    console.error('❌ No menu found');
  } else {
    const dishes = JSON.parse(menuData);
    console.log(`📋 Found ${dishes.length} dishes`);
    
    // Find biryani
    const biryaniDish = dishes.find(d => d.name.toLowerCase().includes('biryani'));
    if (biryaniDish) {
      console.log('🍛 Found Biryani dish:', biryaniDish.name);
      console.log('🥘 Ingredients format:', biryaniDish.ingredients);
      console.log('📊 Ingredients type:', typeof biryaniDish.ingredients);
      console.log('📊 Is array:', Array.isArray(biryaniDish.ingredients));
      
      if (Array.isArray(biryaniDish.ingredients) && biryaniDish.ingredients.length > 0) {
        console.log('🔍 First ingredient:', biryaniDish.ingredients[0]);
        console.log('🔍 First ingredient type:', typeof biryaniDish.ingredients[0]);
        
        if (typeof biryaniDish.ingredients[0] === 'string') {
          console.log('🚨 PROBLEM IDENTIFIED: Ingredients are stored as strings!');
          console.log('🚨 Expected format: {inventoryItemName, quantityPerDish, unit}');
          console.log('🚨 Actual format: ["ingredient1", "ingredient2", ...]');
          console.log('🔧 SOLUTION: Need to convert string ingredients to proper format with quantities');
        } else if (biryaniDish.ingredients[0].inventoryItemName) {
          console.log('✅ Ingredients are in correct format');
          console.log('📋 Sample ingredient:', biryaniDish.ingredients[0]);
        }
      }
    } else {
      console.log('❌ No biryani dish found');
      console.log('📋 Available dishes:', dishes.map(d => d.name));
    }
    
    // Get inventory
    const inventoryKey = `inventory_${currentUser.id}`;
    const inventoryData = localStorage.getItem(inventoryKey);
    if (inventoryData) {
      const inventory = JSON.parse(inventoryData);
      console.log(`📦 Found ${inventory.length} inventory items`);
      console.log('📦 Sample inventory:', inventory.slice(0, 3));
    }
  }
}
