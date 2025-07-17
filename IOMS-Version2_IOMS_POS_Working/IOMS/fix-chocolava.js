// Quick fix script to update Chocolava cake recipe with realistic quantities
// Run this in the browser console to fix the recipe

function fixChocolavaCakeRecipe() {
  console.log('🔧 Fixing Chocolava cake recipe quantities...');
  
  // Get current user (assuming you're logged in)
  const userId = 'maanalvi'; // Replace with your actual user ID if different
  
  // Get current menu
  const menuKey = `restaurantMenu_${userId}`;
  const menu = JSON.parse(localStorage.getItem(menuKey) || '[]');
  
  // Find Chocolava cake
  const chocolavaIndex = menu.findIndex(dish => 
    dish.name.toLowerCase().includes('chocolava') || 
    dish.name.toLowerCase().includes('chocolate')
  );
  
  if (chocolavaIndex === -1) {
    console.log('❌ Chocolava cake not found in menu');
    return;
  }
  
  const chocolavaDish = menu[chocolavaIndex];
  console.log('📋 Found dish:', chocolavaDish.name);
  console.log('📋 Current ingredients:', chocolavaDish.ingredients);
  
  // Update with realistic quantities for cake making
  const newIngredients = [
    { inventoryItemName: 'Dark Chocolate', quantityPerDish: 50, unit: 'g' },     // Was probably too much
    { inventoryItemName: 'Unsalted Butter', quantityPerDish: 30, unit: 'g' },   // Was probably too much  
    { inventoryItemName: 'Granulated Sugar', quantityPerDish: 40, unit: 'g' },  // Was probably too much
    { inventoryItemName: 'Large Eggs', quantityPerDish: 1, unit: 'pcs' },       // Reasonable
    { inventoryItemName: 'All-Purpose Flour', quantityPerDish: 25, unit: 'g' }, // Was probably too much
    { inventoryItemName: 'Vanilla Extract', quantityPerDish: 2, unit: 'ml' },   // Was 40ml - way too much!
    { inventoryItemName: 'Powdered Sugar', quantityPerDish: 15, unit: 'g' }     // Was 200g - way too much!
  ];
  
  // Update the dish
  menu[chocolavaIndex].ingredients = newIngredients;
  
  // Save back to localStorage
  localStorage.setItem(menuKey, JSON.stringify(menu));
  
  console.log('✅ Updated Chocolava cake with realistic quantities:');
  console.log('  - Dark Chocolate: 50g (was much more)');
  console.log('  - Unsalted Butter: 30g');
  console.log('  - Granulated Sugar: 40g');
  console.log('  - Large Eggs: 1 pcs');
  console.log('  - All-Purpose Flour: 25g');
  console.log('  - Vanilla Extract: 2ml (was 40ml!)');
  console.log('  - Powdered Sugar: 15g (was 200g!)');
  
  console.log('🔄 Refreshing page to see updated servings...');
  window.location.reload();
}

// Call the function
fixChocolavaCakeRecipe();
