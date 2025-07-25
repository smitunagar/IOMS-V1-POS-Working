// Test the FIXED Voice AI food extraction logic
// This simulates exactly: "I want to order chicken biryani"

function testFixedFoodExtraction(message) {
  console.log('\n=== TESTING FIXED FOOD EXTRACTION ===\n');
  console.log('Input message:', message);
  
  const lowerMessage = message.toLowerCase();
  
  // Food items extraction (improved pattern matching) - FIXED to prevent duplicates
  const foodItems = [];
  const foodPatterns = [
    // Standard food items
    /(\d+)?\s*(large|medium|small)?\s*(pizza|burger|sandwich|salad|pasta|coffee|drink|water|soda|fries)/g,
    // Proteins and ingredients  
    /(\d+)?\s*(pepperoni|cheese|veggie|chicken|beef|pork|fish|seafood|salmon|tuna)/g,
    // Common dishes
    /(\d+)?\s*(samosa|curry|biryani|naan|rice|soup|stir|fry|grilled|fried|baked)/g,
    // Any word that could be a food item (more generous matching)
    /(\d+)?\s*([a-z]+\s*){1,3}(samosa|curry|biryani|naan|rice|soup|dish|meal|plate)/g
  ];
  
  const foundMatches = new Set(); // CRITICAL FIX: Use Set to prevent duplicates
  
  console.log('Testing each pattern...');
  
  foodPatterns.forEach((pattern, index) => {
    console.log(`\nPattern ${index + 1}: ${pattern}`);
    const matches = [...lowerMessage.matchAll(pattern)];
    console.log(`  Matches found: ${matches.length}`);
    
    matches.forEach((match, matchIndex) => {
      const item = match[0].trim();
      console.log(`  Match ${matchIndex + 1}: "${item}"`);
      
      if (item && !foundMatches.has(item)) { // CRITICAL FIX: Only add if not already found
        foundMatches.add(item);
        foodItems.push(item);
        console.log(`    ✅ Added to food items (new)`);
      } else if (foundMatches.has(item)) {
        console.log(`    ❌ Skipped (duplicate)`);
      }
    });
  });

  // Additional extraction: look for "order" followed by words
  console.log('\nTesting order pattern...');
  const orderMatch = lowerMessage.match(/order\s+(.+?)(?:\s+and\s+(.+?))?(?:\s*$|\s+for|\s+at)/);
  if (orderMatch) {
    console.log(`Order pattern matched: "${orderMatch[0]}"`);
    if (orderMatch[1] && !foundMatches.has(orderMatch[1].trim())) {
      const item = orderMatch[1].trim();
      foundMatches.add(item);
      foodItems.push(item);
      console.log(`  ✅ Added from order pattern: "${item}"`);
    }
    if (orderMatch[2] && !foundMatches.has(orderMatch[2].trim())) {
      const item = orderMatch[2].trim();
      foundMatches.add(item);
      foodItems.push(item);
      console.log(`  ✅ Added second from order pattern: "${item}"`);
    }
  } else {
    console.log('No order pattern match');
  }

  // Extract words after "want" or "get"
  console.log('\nTesting want pattern...');
  const wantMatch = lowerMessage.match(/(?:want|get|have)\s+(?:to\s+order\s+)?(?:a\s+|an\s+|some\s+)?(.+?)(?:\s*$|\s+and|\s+for|\s+at)/);
  if (wantMatch && wantMatch[1]) {
    console.log(`Want pattern matched: "${wantMatch[0]}"`);
    const item = wantMatch[1].trim();
    if (!foundMatches.has(item)) {
      foundMatches.add(item);
      foodItems.push(item);
      console.log(`  ✅ Added from want pattern: "${item}"`);
    } else {
      console.log(`  ❌ Skipped (duplicate): "${item}"`);
    }
  } else {
    console.log('No want pattern match');
  }
  
  console.log(`\n========== EXTRACTION RESULTS ==========`);
  console.log(`Total food items found: ${foodItems.length}`);
  console.log(`Food items: [${foodItems.join(', ')}]`);
  console.log(`Expected: 1 item ("chicken biryani" or similar)`);
  console.log(`Status: ${foodItems.length === 1 ? '✅ FIXED' : '❌ STILL HAS DUPLICATES'}`);
  console.log(`==========================================\n`);
  
  return foodItems;
}

// Test cases
const testCases = [
  "I want to order chicken biryani",
  "I want to order a chicken biryani", 
  "Can I get chicken biryani please",
  "I'd like to order some chicken curry",
  "Order chicken biryani for pickup"
];

testCases.forEach((testCase, index) => {
  console.log(`--- TEST CASE ${index + 1} ---`);
  testFixedFoodExtraction(testCase);
});

console.log('=== ANALYSIS ===');
console.log('If any test case shows more than 1 food item, there are still duplicates to fix.');
console.log('Expected: Each test should result in exactly 1 food item.');
