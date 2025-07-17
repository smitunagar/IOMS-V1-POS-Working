/**
 * 🧪 TEST DATA GENERATOR
 * ====================
 * This script creates test dishes with realistic ingredient requirements
 * to demonstrate the serving availability system.
 */

// Run this in browser console after logging in
function generateTestDishesWithIngredients() {
  const userId = "user1"; // Replace with actual user ID
  
  const testDishes = [
    {
      id: "dish_biryani_001",
      name: "Chicken Biryani",
      price: 12.90,
      category: "Hauptgerichte (Main Dishes)",
      ingredients: [
        { inventoryItemName: "Chicken Breast", quantityPerDish: 150, unit: "g" },
        { inventoryItemName: "Basmati Rice", quantityPerDish: 100, unit: "g" },
        { inventoryItemName: "Onions", quantityPerDish: 50, unit: "g" },
        { inventoryItemName: "Tomatoes", quantityPerDish: 30, unit: "g" },
        { inventoryItemName: "Olive Oil", quantityPerDish: 0.015, unit: "l" } // 15ml = 0.015L
      ]
    },
    {
      id: "dish_dal_002", 
      name: "Dal Masoor Tadka",
      price: 9.90,
      category: "Hauptgerichte (Main Dishes)",
      ingredients: [
        { inventoryItemName: "Masoor Dal", quantityPerDish: 80, unit: "g" },
        { inventoryItemName: "Onions", quantityPerDish: 30, unit: "g" },
        { inventoryItemName: "Tomatoes", quantityPerDish: 40, unit: "g" },
        { inventoryItemName: "Olive Oil", quantityPerDish: 0.010, unit: "l" } // 10ml = 0.010L
      ]
    },
    {
      id: "dish_grilled_003",
      name: "Grilled Chicken with Mozzarella Crust", 
      price: 13.90,
      category: "Hauptgerichte (Main Dishes)",
      ingredients: [
        { inventoryItemName: "Chicken Breast", quantityPerDish: 200, unit: "g" },
        { inventoryItemName: "Mozzarella Cheese", quantityPerDish: 50, unit: "g" },
        { inventoryItemName: "Olive Oil", quantityPerDish: 0.012, unit: "l" } // 12ml = 0.012L
      ]
    },
    {
      id: "dish_curry_004",
      name: "Tomato & Onion Curry",
      price: 8.90, 
      category: "Hauptgerichte (Main Dishes)",
      ingredients: [
        { inventoryItemName: "Tomatoes", quantityPerDish: 120, unit: "g" },
        { inventoryItemName: "Onions", quantityPerDish: 80, unit: "g" },
        { inventoryItemName: "Olive Oil", quantityPerDish: 0.008, unit: "l" } // 8ml = 0.008L
      ]
    },
    {
      id: "dish_samosa_005",
      name: "Samosa Chaat",
      price: 6.50,
      category: "Vorspeisen & Snacks (Starters & Snacks)",
      ingredients: [
        { inventoryItemName: "Samosa (Frozen)", quantityPerDish: 3, unit: "pcs" },
        { inventoryItemName: "Onions", quantityPerDish: 20, unit: "g" },
        { inventoryItemName: "Tomatoes", quantityPerDish: 15, unit: "g" },
        { inventoryItemName: "Olive Oil", quantityPerDish: 0.005, unit: "l" } // 5ml = 0.005L
      ]
    }
  ];

  // Save to localStorage
  localStorage.setItem(`restaurantMenu_${userId}`, JSON.stringify(testDishes));
  
  console.log("✅ Test dishes with ingredients created!");
  console.log("🍽️ Dishes created:", testDishes.length);
  console.log("📊 Total unique ingredients needed:", 
    new Set(testDishes.flatMap(d => d.ingredients.map(i => i.inventoryItemName))).size
  );
  
  return testDishes;
}

// Helper function to create matching inventory items
function generateMatchingInventory() {
  const userId = "user1"; // Replace with actual user ID
  
  const inventoryItems = [
    {
      id: "inv_chicken_001",
      name: "Chicken Breast",
      quantity: 1000, // 1kg = enough for ~6 biryanis or 5 grilled chicken
      unit: "g",
      category: "Meat & Seafood",
      lowStockThreshold: 200,
      lastRestocked: new Date().toISOString(),
      quantityUsed: 0,
      image: "https://placehold.co/60x60.png",
      aiHint: "chicken breast meat"
    },
    {
      id: "inv_rice_002", 
      name: "Basmati Rice",
      quantity: 500, // 500g = enough for 5 biryanis
      unit: "g",
      category: "Grains & Cereals",
      lowStockThreshold: 100,
      lastRestocked: new Date().toISOString(),
      quantityUsed: 0,
      image: "https://placehold.co/60x60.png",
      aiHint: "basmati rice grains"
    },
    {
      id: "inv_onions_003",
      name: "Onions", 
      quantity: 200, // 200g = enough for multiple dishes
      unit: "g",
      category: "Fresh Vegetables",
      lowStockThreshold: 50,
      lastRestocked: new Date().toISOString(),
      quantityUsed: 0,
      image: "https://placehold.co/60x60.png", 
      aiHint: "yellow onions"
    },
    {
      id: "inv_tomatoes_004",
      name: "Tomatoes",
      quantity: 300, // 300g = enough for multiple dishes
      unit: "g", 
      category: "Fresh Vegetables",
      lowStockThreshold: 50,
      lastRestocked: new Date().toISOString(),
      quantityUsed: 0,
      image: "https://placehold.co/60x60.png",
      aiHint: "fresh tomatoes"
    },
    {
      id: "inv_oil_005",
      name: "Olive Oil",
      quantity: 0.1, // 0.1L = 100ml = enough for multiple dishes (this will be limiting factor)
      unit: "l",
      category: "Cooking Oils", 
      lowStockThreshold: 0.02, // 20ml = 0.02L
      lastRestocked: new Date().toISOString(),
      quantityUsed: 2.3, // This explains the "2300" value! (2.3L = 2300ml)
      image: "https://placehold.co/60x60.png",
      aiHint: "olive oil cooking"
    },
    {
      id: "inv_mozzarella_006",
      name: "Mozzarella Cheese",
      quantity: 150, // 150g = enough for 3 grilled chicken dishes
      unit: "g",
      category: "Dairy",
      lowStockThreshold: 30,
      lastRestocked: new Date().toISOString(),
      quantityUsed: 0,
      image: "https://placehold.co/60x60.png",
      aiHint: "mozzarella cheese"
    },
    {
      id: "inv_dal_007",
      name: "Masoor Dal",
      quantity: 400, // 400g = enough for 5 dal dishes
      unit: "g",
      category: "General",
      lowStockThreshold: 50,
      lastRestocked: new Date().toISOString(),
      quantityUsed: 0,
      image: "https://placehold.co/60x60.png",
      aiHint: "red lentils masoor"
    },
    {
      id: "inv_samosa_008",
      name: "Samosa (Frozen)",
      quantity: 20, // 20 pieces = enough for ~6 servings
      unit: "pcs",
      category: "Frozen Foods",
      lowStockThreshold: 5,
      lastRestocked: new Date().toISOString(),
      quantityUsed: 0,
      image: "https://placehold.co/60x60.png",
      aiHint: "frozen samosa"
    }
  ];

  // Save to localStorage
  localStorage.setItem(`restaurantInventory_${userId}`, JSON.stringify(inventoryItems));
  
  console.log("✅ Matching inventory created!");
  console.log("📦 Inventory items created:", inventoryItems.length);
  console.log("🔍 Note: Olive Oil already has 2.3L used - this explains the '2300' value (2.3 liters)!");
  
  return inventoryItems;
}

// Helper to calculate expected serving limits
function calculateServingLimits() {
  console.log("\n🧮 EXPECTED SERVING LIMITS:");
  console.log("================================");
  console.log("🍽️ Chicken Biryani:");
  console.log("  • Chicken: 1000g ÷ 150g = 6 servings");  
  console.log("  • Rice: 500g ÷ 100g = 5 servings");
  console.log("  • Onions: 200g ÷ 50g = 4 servings");
  console.log("  • Oil: 0.1L ÷ 0.015L = 6 servings");
  console.log("  → LIMITED BY: Onions (4 servings max)");
  
  console.log("\n🍽️ Grilled Chicken:");
  console.log("  • Chicken: 1000g ÷ 200g = 5 servings");
  console.log("  • Mozzarella: 150g ÷ 50g = 3 servings");  
  console.log("  • Oil: 0.1L ÷ 0.012L = 8 servings");
  console.log("  → LIMITED BY: Mozzarella (3 servings max)");
  
  console.log("\n🍽️ Samosa Chaat:");
  console.log("  • Samosa: 20 pcs ÷ 3 pcs = 6 servings");
  console.log("  • Onions: 200g ÷ 20g = 10 servings");
  console.log("  • Oil: 0.1L ÷ 0.005L = 20 servings");
  console.log("  → LIMITED BY: Samosa (6 servings max)");
}

// Complete setup function
function setupCompleteTestData() {
  console.log("🚀 Setting up complete test data...");
  
  const dishes = generateTestDishesWithIngredients();
  const inventory = generateMatchingInventory();
  
  calculateServingLimits();
  
  console.log("\n✅ SETUP COMPLETE!");
  console.log("📝 Instructions:");
  console.log("1. Refresh the page to see the new data");
  console.log("2. Go to 'Serving Availability' page to test the system");
  console.log("3. Try ordering different quantities to see limits in action");
  console.log("4. The '2300' value represents 2.3 liters of Olive Oil already used");
  
  return { dishes, inventory };
}

// Export for use
if (typeof window !== 'undefined') {
  window.setupCompleteTestData = setupCompleteTestData;
  window.generateTestDishesWithIngredients = generateTestDishesWithIngredients;
  window.generateMatchingInventory = generateMatchingInventory;
}

console.log("🧪 Test data generator loaded!");
console.log("💡 Run setupCompleteTestData() to create test data");
