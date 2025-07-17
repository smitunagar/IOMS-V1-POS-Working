// Clear Menu Script - Run this in browser console to force fresh menu import
console.log('🧹 Clearing menu localStorage to force fresh import...');

// Clear all menu-related localStorage items
Object.keys(localStorage).forEach(key => {
  if (key.includes('restaurantMenu')) {
    console.log('Removing:', key);
    localStorage.removeItem(key);
  }
});

console.log('✅ Menu localStorage cleared! Now refresh the page and import menu again.');
console.log('📝 This will ensure all dish names are cleaned (price information removed).');
