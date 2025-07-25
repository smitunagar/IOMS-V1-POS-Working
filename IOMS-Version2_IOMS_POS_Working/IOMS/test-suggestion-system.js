// Test the improved suggestion system for Voice AI
// This simulates the exact scenario: "vegetable samosa" request

const testMenu = [
  { id: '5', name: 'Samosa Chaat', price: 6.50, category: 'Starters' },
  { id: '6', name: 'Cheesy Samosa Bake', price: 7.00, category: 'Starters' },
  { id: '7', name: 'Chicken Curry', price: 12.00, category: 'Mains' },
  { id: '8', name: 'Vegetable Curry', price: 10.00, category: 'Mains' }
];

function findSuggestions(unmatchedItem, menuItems) {
  const suggestions = [];
  const itemWords = unmatchedItem.toLowerCase().split(/\s+/);
  
  for (const word of itemWords) {
    if (word.length > 3) { // Look for significant words
      const similarItems = menuItems.filter(dish => 
        dish.name.toLowerCase().includes(word)
      ).slice(0, 3); // Limit to 3 suggestions per word
      
      similarItems.forEach(dish => {
        if (!suggestions.some(s => s.name === dish.name)) {
          suggestions.push({ name: dish.name, price: dish.price });
        }
      });
    }
  }
  
  return suggestions;
}

// Test the scenario
console.log('\n=== VOICE AI SUGGESTION SYSTEM TEST ===\n');

const userRequest = "vegetable samosa";
console.log(`User asked for: "${userRequest}"`);

// Check if exact match exists
const exactMatch = testMenu.find(item => 
  item.name.toLowerCase() === userRequest.toLowerCase()
);

if (exactMatch) {
  console.log(`✅ Exact match found: ${exactMatch.name}`);
} else {
  console.log(`❌ No exact match for "${userRequest}"`);
  
  // Find suggestions
  const suggestions = findSuggestions(userRequest, testMenu);
  
  if (suggestions.length > 0) {
    console.log(`💡 Suggestions found:`);
    suggestions.forEach(s => console.log(`   - ${s.name} ($${s.price})`));
    
    const errorMessage = `I couldn't find "${userRequest}" in our menu. Did you mean: ${suggestions.map(s => s.name).join(', ')}?`;
    console.log(`\n📢 Voice AI Response:`);
    console.log(`"${errorMessage}"`);
  } else {
    console.log(`No suggestions found`);
  }
}

console.log('\n=== TEST COMPLETE ===\n');

// Test with different requests
const testCases = ['beef samosa', 'veggie curry', 'cheese samosa'];
console.log('=== ADDITIONAL TEST CASES ===\n');

testCases.forEach(testCase => {
  console.log(`Test: "${testCase}"`);
  const suggestions = findSuggestions(testCase, testMenu);
  if (suggestions.length > 0) {
    console.log(`  Suggestions: ${suggestions.map(s => s.name).join(', ')}`);
  } else {
    console.log(`  No suggestions found`);
  }
  console.log('---');
});
