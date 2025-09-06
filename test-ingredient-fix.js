// Quick test to simulate the ingredient processing fix
const testMenuItems = [
  {
    id: "1",
    name: "Chicken Biryani",
    price: "12.90 EUR",
    category: "Main Dishes",
    ingredients: ["Basmati Rice", "Chicken Breast", "Onions", "Tomatoes", "Olive Oil"] // String format from AI
  },
  {
    id: "2", 
    name: "Dal Masoor Tadka",
    price: "9.90 EUR",
    category: "Vegetarian",
    ingredients: ["Red Lentils", "Cumin", "Turmeric", "Onions", "Tomatoes"] // String format from AI
  },
  {
    id: "3",
    name: "Test Item",
    price: "8.50 EUR", 
    category: "Test",
    ingredients: [] // Missing ingredients
  }
];

// Simulate the fix
function processIngredients(items) {
  const itemsWithIngredients = items.filter(item => 
    Array.isArray(item.ingredients) && item.ingredients.length > 0
  );
  
  const itemsNeedingIngredients = items.filter(item => 
    !Array.isArray(item.ingredients) || item.ingredients.length === 0
  );
  
  console.log(`📊 Items with ingredients from AI: ${itemsWithIngredients.length}`);
  console.log(`📊 Items needing ingredient enrichment: ${itemsNeedingIngredients.length}`);
  
  // Convert string ingredients to proper format for items that have them
  itemsWithIngredients.forEach(item => {
    if (Array.isArray(item.ingredients) && item.ingredients.length > 0) {
      // Convert string ingredients to proper object format
      if (typeof item.ingredients[0] === 'string') {
        item.ingredients = item.ingredients.map((ing) => ({
          inventoryItemName: ing,
          quantityPerDish: 50, // Default quantity
          unit: 'g' // Default unit
        }));
        console.log(`🔄 Converted ${item.ingredients.length} string ingredients to objects for ${item.name}`);
      }
    }
  });
  
  return [...itemsWithIngredients, ...itemsNeedingIngredients];
}

console.log('Testing ingredient processing fix...\n');
const result = processIngredients(testMenuItems);

console.log('\nFinal results:');
result.forEach(item => {
  console.log(`${item.name}: ${item.ingredients.length} ingredients`);
  if (item.ingredients.length > 0) {
    console.log('  First ingredient:', item.ingredients[0]);
  }
});
