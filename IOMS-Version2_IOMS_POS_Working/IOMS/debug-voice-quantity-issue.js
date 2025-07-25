// Test Voice AI Order Processing - Debug Chicken Biryani Issue
// This simulates exactly what happens when user says "I want to order a chicken biryani"

const testOrder = {
  userId: 'test_user',
  customerName: 'Test Customer',
  items: [
    { itemName: 'chicken biryani', quantity: 1, specialInstructions: '' }
  ],
  orderType: 'dine-in',
  tableId: 'table-1'
};

console.log('\n=== VOICE AI ORDER DEBUG TEST ===\n');
console.log('Simulating API call to voice-agent/create-order...\n');

// Simulate the exact processing logic from the API
console.log('1. RAW REQUEST:');
console.log(JSON.stringify(testOrder, null, 2));

console.log('\n2. PROCESSING ITEMS:');
testOrder.items.forEach((item, index) => {
  console.log(`RAW ITEM ${index + 1}:`, {
    itemName: item.itemName,
    quantity: item.quantity,
    quantityType: typeof item.quantity,
    specialInstructions: item.specialInstructions
  });
});

// Test consolidation logic
console.log('\n3. CONSOLIDATION LOGIC:');
const consolidatedItems = [];
const itemMap = new Map();

testOrder.items.forEach(item => {
  const normalizedName = item.itemName.toLowerCase().trim();
  const currentQuantity = itemMap.get(normalizedName) || 0;
  const itemQuantity = item.quantity || 1;
  
  console.log(`Processing item: "${item.itemName}" - Adding quantity ${itemQuantity} to existing ${currentQuantity}`);
  itemMap.set(normalizedName, currentQuantity + itemQuantity);
});

console.log('ITEM MAP after consolidation:', Array.from(itemMap.entries()));

for (const [itemName, totalQuantity] of itemMap) {
  const originalItem = testOrder.items.find(item => item.itemName.toLowerCase().trim() === itemName);
  consolidatedItems.push({
    itemName: originalItem?.itemName || itemName,
    quantity: totalQuantity,
    specialInstructions: originalItem?.specialInstructions || ''
  });
}

console.log('CONSOLIDATED ITEMS:', JSON.stringify(consolidatedItems, null, 2));

// Test menu matching
console.log('\n4. MENU MATCHING:');
const testMenu = [
  { id: '1', name: 'Chicken Biryani - 12.90 EUR', price: '12.90 EUR' }
];

const matchedOrderItems = [];
let subtotal = 0;

for (const voiceItem of consolidatedItems) {
  console.log(`Trying to match: "${voiceItem.itemName}" (quantity: ${voiceItem.quantity})`);
  
  // Find matching menu item
  const menuItem = testMenu.find(dish => {
    const dishName = dish.name.toLowerCase();
    const itemName = voiceItem.itemName.toLowerCase();
    
    // Exact match
    if (dishName === itemName) return true;
    
    // Partial match in either direction
    if (dishName.includes(itemName) || itemName.includes(dishName)) return true;
    
    // Word-by-word matching
    const dishWords = dishName.split(/\s+/);
    const itemWords = itemName.split(/\s+/);
    
    for (const itemWord of itemWords) {
      if (itemWord.length > 2) {
        for (const dishWord of dishWords) {
          if (dishWord.includes(itemWord) || itemWord.includes(dishWord)) {
            return true;
          }
        }
      }
    }
    
    return false;
  });

  if (menuItem) {
    // Handle price conversion
    let price = 0;
    if (typeof menuItem.price === 'number') {
      price = menuItem.price;
    } else if (menuItem.price) {
      const priceStr = String(menuItem.price);
      price = parseFloat(priceStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    }

    const totalPrice = price * voiceItem.quantity;

    matchedOrderItems.push({
      dishId: menuItem.id,
      name: menuItem.name,
      quantity: voiceItem.quantity,
      unitPrice: price,
      totalPrice
    });

    subtotal += totalPrice;
    
    console.log(`✅ Matched "${voiceItem.itemName}" to "${menuItem.name}"`);
    console.log(`   Unit Price: €${price}`);
    console.log(`   Quantity: ${voiceItem.quantity}`);
    console.log(`   Total Price: €${totalPrice}`);
  } else {
    console.log(`❌ Could not match "${voiceItem.itemName}"`);
  }
}

// Calculate final totals
console.log('\n5. FINAL CALCULATION:');
const taxRate = 0.10;
const taxAmount = subtotal * taxRate;
const totalAmount = subtotal + taxAmount;

console.log(`Subtotal: €${subtotal.toFixed(2)}`);
console.log(`Tax (10%): €${taxAmount.toFixed(2)}`);
console.log(`Total: €${totalAmount.toFixed(2)}`);

// Convert to USD for comparison
const usdRate = 1.1; // Approximate
const totalUSD = totalAmount * usdRate;
console.log(`Total in USD: $${totalUSD.toFixed(2)}`);

console.log('\n6. EXPECTED vs ACTUAL:');
console.log(`Expected: ~$15.61 (1 chicken biryani with tax)`);
console.log(`Actual from your order: $70.95`);
console.log(`Difference suggests: ${(70.95 / 15.61).toFixed(1)}x multiplication`);

console.log('\n=== DEBUG TEST COMPLETE ===\n');
