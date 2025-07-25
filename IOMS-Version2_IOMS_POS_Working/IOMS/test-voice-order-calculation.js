// Test Voice Order Price Calculation
// This tests the exact scenario: 1 chicken biryani

const testMenuItems = [
  { id: '1', name: 'Chicken Biryani - 12.90 EUR', price: '12.90 EUR' },
  { id: '2', name: 'Dal Masoor Tadka - 9.90 EUR', price: '9.90 EUR' },
  // Add more items as needed
];

const testVoiceOrder = {
  items: [
    { itemName: 'chicken biryani', quantity: 1, specialInstructions: '' }
  ]
};

console.log('\n=== VOICE ORDER CALCULATION TEST ===\n');

// Test price parsing logic from the API
function parsePrice(priceStr) {
  if (typeof priceStr === 'number') {
    return priceStr;
  } else if (priceStr) {
    const cleaned = String(priceStr).replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

// Test item matching logic
function findMatchingItem(voiceItemName, menuItems) {
  const itemName = voiceItemName.toLowerCase();
  
  return menuItems.find(dish => {
    const dishName = dish.name.toLowerCase();
    
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
}

// Process the order
const voiceItem = testVoiceOrder.items[0];
console.log(`Looking for: "${voiceItem.itemName}" (quantity: ${voiceItem.quantity})`);

const matchedItem = findMatchingItem(voiceItem.itemName, testMenuItems);

if (matchedItem) {
  console.log(`✅ Matched to: "${matchedItem.name}"`);
  console.log(`Raw price: "${matchedItem.price}"`);
  
  const parsedPrice = parsePrice(matchedItem.price);
  console.log(`Parsed price: ${parsedPrice}`);
  
  const itemTotal = parsedPrice * voiceItem.quantity;
  console.log(`Item total: ${parsedPrice} × ${voiceItem.quantity} = ${itemTotal}`);
  
  // Calculate tax (10%)
  const taxRate = 0.10;
  const subtotal = itemTotal;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;
  
  console.log(`\nOrder Summary:`);
  console.log(`Subtotal: €${subtotal.toFixed(2)}`);
  console.log(`Tax (10%): €${taxAmount.toFixed(2)}`);
  console.log(`Total: €${totalAmount.toFixed(2)}`);
  
  // Convert to USD (assuming 1 EUR = 1.1 USD for testing)
  const usdRate = 1.1;
  const totalUSD = totalAmount * usdRate;
  console.log(`Total in USD (≈$${totalUSD.toFixed(2)})`);
  
} else {
  console.log(`❌ No match found for "${voiceItem.itemName}"`);
}

console.log('\n=== TEST COMPLETE ===\n');
