// Test heuristic extraction directly
const path = require('path');

// Import our heuristic function (simplified version)
function extractHeuristicFromText(text) {
  console.log('Extracting from text:', text.substring(0, 200) + '...');
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const menuItems = [];
  
  // Enhanced price regex patterns
  const pricePatterns = [
    /(.+?)\s*[-–—]\s*([€$£¥₹]\s*\d+\.?\d*|\d+\.?\d*\s*[€$£¥₹])/i,
    /(.+?)\s*[:.]\s*([€$£¥₹]\s*\d+\.?\d*|\d+\.?\d*\s*[€$£¥₹])/i,
    /(.+?)\s+([€$£¥₹]\s*\d+\.?\d*|\d+\.?\d*\s*[€$£¥₹])\s*$/i
  ];
  
  console.log('Processing', lines.length, 'lines...');
  
  lines.forEach((line, index) => {
    console.log(`Line ${index}: "${line}"`);
    
    for (const pattern of pricePatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1].trim();
        const price = match[2].trim();
        
        // Skip if name is too short or looks like a header
        if (name.length < 3 || /^(menu|appetizer|main|dessert|beverage)/i.test(name)) {
          console.log(`  Skipped: "${name}" (too short or header)`);
          continue;
        }
        
        const item = {
          name,
          price,
          category: 'Uncategorized'
        };
        
        console.log(`  Found item:`, item);
        menuItems.push(item);
        break;
      }
    }
  });
  
  console.log('\nExtracted', menuItems.length, 'items total');
  return menuItems;
}

// Test with realistic menu text
const testMenuText = `
RESTAURANT MENU

Appetizers
Chicken Wings - €12.50
Caesar Salad - €8.90
Soup of the Day - €6.50

Main Courses  
Grilled Salmon - €18.00
Beef Steak - €22.50
Vegetarian Pasta - €14.90

Desserts
Chocolate Cake - €7.50
Ice Cream - €5.00

Beverages
Coffee - €3.50
Tea - €2.80
Wine Glass - €6.90
`;

console.log('=== TESTING HEURISTIC EXTRACTION ===\n');

const extracted = extractHeuristicFromText(testMenuText);

console.log('\n=== FINAL RESULTS ===');
console.log(JSON.stringify(extracted, null, 2));
