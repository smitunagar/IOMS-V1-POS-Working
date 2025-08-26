// Test Menu Persistence Script
// Run this in browser console after saving menu

console.log('🧪 Testing Menu Persistence...');

// Check localStorage
const userId = JSON.parse(localStorage.getItem('auth'))?.currentUser?.id;
if (!userId) {
  console.error('❌ No user found in localStorage');
} else {
  console.log('✅ User ID found:', userId);
  
  const menuKey = `restaurantMenu_${userId}`;
  const storedMenu = localStorage.getItem(menuKey);
  
  if (!storedMenu) {
    console.error('❌ No menu found in localStorage for key:', menuKey);
  } else {
    try {
      const parsedMenu = JSON.parse(storedMenu);
      console.log('✅ Menu found in localStorage:');
      console.log(`📊 Total dishes: ${parsedMenu.length}`);
      console.log('📋 First few dishes:', parsedMenu.slice(0, 3));
    } catch (e) {
      console.error('❌ Failed to parse menu from localStorage:', e);
    }
  }
}

// Check API endpoint
console.log('🔍 Testing API endpoint...');
fetch('/api/menuCsv')
  .then(res => res.json())
  .then(data => {
    if (data.menu && Array.isArray(data.menu)) {
      console.log('✅ Menu found in API:');
      console.log(`📊 Total dishes from API: ${data.menu.length}`);
      console.log('📋 First few dishes from API:', data.menu.slice(0, 3));
    } else {
      console.error('❌ No valid menu data from API:', data);
    }
  })
  .catch(err => {
    console.error('❌ Failed to fetch menu from API:', err);
  });

console.log('🔄 To test refresh persistence:');
console.log('1. Save your menu');
console.log('2. Go to the order entry page (/)');
console.log('3. Refresh the page');
console.log('4. Check if menu items are still visible');
