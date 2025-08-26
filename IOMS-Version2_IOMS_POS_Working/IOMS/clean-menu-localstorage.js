// Script to clean existing menu data in localStorage
// Run this in the browser console after the application loads

console.log('🧹 Cleaning existing menu data in localStorage...');

// Function to clean menu item names
function cleanMenuItemName(name) {
  if (!name) return name;
  
  return name
    .replace(/\s*-\s*\d+[\.,]\d+\s*(EUR|USD|GBP|€|\$|£)\s*$/i, '')
    .replace(/\s*-\s*\d+[\.,]\d+\s*$/i, '')
    .replace(/\s*\(\d+[\.,]\d+\s*(EUR|USD|GBP|€|\$|£)\)\s*$/i, '')
    .replace(/\s*\$\d+[\.,]\d+\s*$/i, '')
    .replace(/\s*€\d+[\.,]\d+\s*$/i, '')
    .replace(/\s*£\d+[\.,]\d+\s*$/i, '')
    .trim();
}

// Get current user
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
if (!currentUser) {
  console.log('❌ No user logged in. Please login first.');
} else {
  const menuKey = `restaurantMenu_${currentUser.id}`;
  const menuData = localStorage.getItem(menuKey);
  
  if (!menuData) {
    console.log('❌ No menu data found. Please import menu first.');
  } else {
    try {
      const menu = JSON.parse(menuData);
      console.log(`📋 Found ${menu.length} menu items to clean`);
      
      let cleanedCount = 0;
      const cleanedMenu = menu.map(dish => {
        const originalName = dish.name;
        const cleanedName = cleanMenuItemName(originalName);
        
        if (originalName !== cleanedName) {
          cleanedCount++;
          console.log(`✅ "${originalName}" → "${cleanedName}"`);
          return { ...dish, name: cleanedName };
        } else {
          console.log(`➡️ "${originalName}" (already clean)`);
          return dish;
        }
      });
      
      // Save the cleaned menu back to localStorage
      localStorage.setItem(menuKey, JSON.stringify(cleanedMenu));
      
      console.log(`\n✅ Cleaned ${cleanedCount} menu items!`);
      console.log('🔄 Menu data updated in localStorage');
      console.log('🎯 Inventory matching should now work properly');
      
      // Trigger a page refresh to load the cleaned data
      if (cleanedCount > 0) {
        console.log('🔄 Refreshing page to load cleaned menu...');
        setTimeout(() => window.location.reload(), 1000);
      }
      
    } catch (error) {
      console.error('❌ Error cleaning menu data:', error);
    }
  }
}

console.log('\n💡 After the page refreshes:');
console.log('1. Go to the Debug page to verify menu-inventory alignment');
console.log('2. Try placing an order to test inventory deduction');
console.log('3. Check that inventory quantities update correctly');
