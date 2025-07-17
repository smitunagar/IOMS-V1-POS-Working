// menuService.ts

export interface IngredientQuantity {
  inventoryItemName: string;
  quantityPerDish: number;
  unit: string;
}

export interface Dish {
  id: string;
  name: string;
  price: number | string;
  category: string;
  image: string;
  aiHint: string;
  ingredients: IngredientQuantity[] | string[]; // For legacy or parsed dishes
  // 🔥 NEW: Add inventory status fields
  isAvailable?: boolean;
  stockStatus?: 'available' | 'low-stock' | 'out-of-stock';
  missingIngredients?: string[];
  estimatedServings?: number;
}

const MENU_STORAGE_KEY_BASE = 'restaurantMenu';

// Import POS integration functions
import { validateDishAvailability, getMenuAvailability, type MenuAvailability } from './posInventoryIntegration';

function generateDishId(): string {
  return `dish_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getUserMenuStorageKey(userId: string): string {
  return `${MENU_STORAGE_KEY_BASE}_${userId}`;
}

export function getDishes(userId: string | null): Dish[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const menuStorageKey = getUserMenuStorageKey(userId);
    const storedMenu = localStorage.getItem(menuStorageKey);
    if (storedMenu) {
      const parsed = JSON.parse(storedMenu);
      const dishes = Array.isArray(parsed) ? parsed : [];
      // Clean dish names when loading to remove any price information
      return dishes.map(dish => ({
        ...dish,
        name: cleanMenuItemName(dish.name)
      }));
    }
    localStorage.setItem(menuStorageKey, JSON.stringify([]));
    return [];
  } catch (e) {
    console.error('Error reading menu:', e);
    return [];
  }
}

export function saveDishes(userId: string | null, dishes: Dish[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const menuStorageKey = getUserMenuStorageKey(userId);
    // Clean dish names before saving
    const cleanedDishes = dishes.map(dish => ({
      ...dish,
      name: cleanMenuItemName(dish.name)
    }));
    localStorage.setItem(menuStorageKey, JSON.stringify(cleanedDishes));
  } catch (e) {
    console.error('Error saving menu:', e);
  }
}

function transformAIIngredients(aiIngredients: any): IngredientQuantity[] {
  let transformedIngredients: IngredientQuantity[];
  
  if (Array.isArray(aiIngredients) && aiIngredients.length > 0) {
    // Check if it's AI format { name, quantity, unit }
    if (aiIngredients[0] && typeof aiIngredients[0] === 'object' && 'name' in aiIngredients[0]) {
      console.log('🔄 Converting AI ingredients format to menu format:', aiIngredients);
      transformedIngredients = aiIngredients.map(ingredient => ({
        inventoryItemName: ingredient.name,          // AI format: name -> inventoryItemName
        quantityPerDish: ingredient.quantity,       // AI format: quantity -> quantityPerDish  
        unit: ingredient.unit                       // Same format
      }));
    }
    // Check if it's already in correct IngredientQuantity format
    else if (aiIngredients[0] && typeof aiIngredients[0] === 'object' && 'inventoryItemName' in aiIngredients[0]) {
      console.log('✅ Ingredients already in correct format');
      transformedIngredients = aiIngredients as IngredientQuantity[];
    }
    // Handle string array (legacy)
    else if (typeof aiIngredients[0] === 'string') {
      console.log('🔄 Converting string array to IngredientQuantity format');
      transformedIngredients = aiIngredients.map(name => ({
        inventoryItemName: name,
        quantityPerDish: 1,
        unit: 'pcs',
      }));
    } else {
      console.warn('⚠️ Unknown ingredient format:', aiIngredients);
      transformedIngredients = [];
    }
  } else {
    transformedIngredients = [];
  }
  
  return transformedIngredients;
}

export function addDishToMenu(userId: string | null, dishName: string, aiIngredients: any): Dish | null {
  if (typeof window === 'undefined' || !userId) return null;
  const currentDishes = getDishes(userId);

  // 🔥 NEW: Check if dish already exists (case-insensitive)
  const existingDish = currentDishes.find(dish => 
    dish.name.toLowerCase().trim() === dishName.toLowerCase().trim()
  );
  
  if (existingDish) {
    console.log('🔄 Dish already exists, updating ingredients:', existingDish.name);
    
    // Update existing dish with new ingredients
    const transformedIngredients = transformAIIngredients(aiIngredients);
    existingDish.ingredients = transformedIngredients;
    
    saveDishes(userId, currentDishes);
    console.log('✅ Updated existing dish with new ingredients:', existingDish);
    
    // Trigger menu refresh event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('menu-updated'));
    }
    
    return existingDish;
  }

  // 🔥 FIXED: Convert AI ingredients to the correct IngredientQuantity format
  const transformedIngredients = transformAIIngredients(aiIngredients);

  console.log('📋 Final transformed ingredients for dish:', dishName, transformedIngredients);

  const newDish: Dish = {
    id: generateDishId(),
    name: dishName,
    price: 10.00,
    category: "New Dishes",
    image: "https://placehold.co/100x100.png",
    aiHint: dishName.toLowerCase().split(' ').slice(0, 2).join(' '),
    ingredients: transformedIngredients,
  };

  const updatedDishes = [...currentDishes, newDish];
  saveDishes(userId, updatedDishes);
  console.log('✅ Dish added to menu with ingredients:', newDish);
  
  // Trigger menu refresh event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('menu-updated'));
  }
  
  return newDish;
}

/**
 * 🔥 NEW: Get dishes with inventory availability status
 */
export function getDishesWithAvailability(userId: string | null): Dish[] {
  const dishes = getDishes(userId);
  if (!userId || typeof window === 'undefined') return dishes;
  
  try {
    const availabilityData = getMenuAvailability(userId, dishes);
    
    return dishes.map(dish => {
      const availability = availabilityData.find(item => item.dishId === dish.id);
      
      if (availability) {
        return {
          ...dish,
          isAvailable: availability.isAvailable,
          stockStatus: availability.stockStatus,
          missingIngredients: availability.missingIngredients,
          estimatedServings: availability.estimatedServings
        };
      }
      
      return dish;
    });
  } catch (error) {
    console.error('Error checking menu availability:', error);
    return dishes;
  }
}

/**
 * 🔥 NEW: Check if a specific dish is available for ordering
 */
export function checkDishAvailability(userId: string | null, dish: Dish, quantity: number = 1): {
  canOrder: boolean;
  message: string;
  details: any;
} {
  if (!userId || typeof window === 'undefined') {
    return {
      canOrder: false,
      message: "User not authenticated",
      details: null
    };
  }
  
  const validation = validateDishAvailability(userId, dish, quantity);
  
  if (!validation.isAvailable) {
    const missingItems = validation.missingIngredients.join(', ');
    return {
      canOrder: false,
      message: `Cannot serve ${dish.name}. Missing ingredients: ${missingItems}. Please check inventory.`,
      details: validation
    };
  }
  
  if (validation.lowStockIngredients.length > 0) {
    const lowStockItems = validation.lowStockIngredients.join(', ');
    return {
      canOrder: true,
      message: `Warning: Low stock on ingredients: ${lowStockItems}`,
      details: validation
    };
  }
  
  return {
    canOrder: true,
    message: `${dish.name} is available (${validation.availableQuantity} servings possible)`,
    details: validation
  };
}

/**
 * 🔥 NEW: Debug function to check dish ingredients and inventory alignment
 */
export function debugDishInventoryAlignment(userId: string | null, dishName: string): void {
  if (!userId || typeof window === 'undefined') {
    console.log('❌ Debug: No user ID or not in browser');
    return;
  }
  
  console.log('🔍 =========================');
  console.log('🔍 DEBUG: Dish-Inventory Alignment for:', dishName);
  console.log('🔍 =========================');
  
  // Get the dish
  const dishes = getDishes(userId);
  const dish = dishes.find(d => d.name.toLowerCase().includes(dishName.toLowerCase()));
  
  if (!dish) {
    console.log('❌ Dish not found in menu');
    return;
  }
  
  console.log('📋 Dish found:', dish.name);
  console.log('📋 Dish ingredients:', dish.ingredients);
  
  // Check if ingredients are in correct format
  if (Array.isArray(dish.ingredients)) {
    dish.ingredients.forEach((ingredient: any, index: number) => {
      console.log(`📋 Ingredient ${index + 1}:`, ingredient);
      
      if (typeof ingredient === 'object' && ingredient !== null) {
        if ('inventoryItemName' in ingredient) {
          console.log(`  ✅ Correct format: ${ingredient.inventoryItemName} - ${ingredient.quantityPerDish} ${ingredient.unit}`);
        } else if ('name' in ingredient) {
          console.log(`  🔄 AI format detected: ${ingredient.name} - ${ingredient.quantity} ${ingredient.unit}`);
        } else {
          console.log('  ❌ Unknown format:', ingredient);
        }
      } else {
        console.log('  🔄 String format:', ingredient);
      }
    });
  }
  
  // Check inventory
  const { getInventory } = require('./inventoryService');
  const inventory = getInventory(userId);
  console.log('📦 Current inventory items:', inventory.map((item: any) => `${item.name}: ${item.quantity} ${item.unit}`));
  
  // Check availability
  try {
    const availability = checkDishAvailability(userId, dish, 1);
    console.log('🎯 Availability check result:', availability);
  } catch (error) {
    console.log('❌ Availability check failed:', error);
  }
  
  console.log('🔍 =========================');
}

/**
 * 🔥 NEW: Enhanced debug function specifically for servings calculation issues
 */
export function debugServingsCalculation(userId: string | null, dishName: string): void {
  if (!userId || typeof window === 'undefined') {
    console.log('❌ Debug: No user ID or not in browser');
    return;
  }
  
  console.log('🧮 ===== SERVINGS CALCULATION DEBUG =====');
  console.log('🧮 Analyzing dish:', dishName);
  
  // Get the dish
  const dishes = getDishes(userId);
  const dish = dishes.find(d => d.name.toLowerCase().includes(dishName.toLowerCase()));
  
  if (!dish) {
    console.log('❌ Dish not found in menu');
    return;
  }
  
  // Get inventory
  const { getInventory } = require('./inventoryService');
  const inventory = getInventory(userId);
  
  console.log('📋 Dish ingredients analysis:');
  console.log('📋 Dish object:', dish);
  
  if (Array.isArray(dish.ingredients)) {
    let limitingFactor = Infinity;
    let limitingIngredient = '';
    
    dish.ingredients.forEach((ingredientSpec: any, index: number) => {
      console.log(`\n🔍 Ingredient ${index + 1}:`);
      console.log('  📋 Raw ingredient data:', ingredientSpec);
      
      if (typeof ingredientSpec === 'object' && 'inventoryItemName' in ingredientSpec) {
        const ingredient = ingredientSpec as IngredientQuantity;
        console.log(`  📝 Name: "${ingredient.inventoryItemName}"`);
        console.log(`  📝 Required per dish: ${ingredient.quantityPerDish} ${ingredient.unit}`);
        
        // Try to find in inventory
        const inventoryItem = inventory.find((item: any) => 
          item.name.toLowerCase().trim() === ingredient.inventoryItemName.toLowerCase().trim()
        );
        
        if (inventoryItem) {
          console.log(`  ✅ Found in inventory: "${inventoryItem.name}"`);
          console.log(`  📦 Available: ${inventoryItem.quantity} ${inventoryItem.unit}`);
          
          // Calculate possible servings (this is the key calculation!)
          let possibleServings = 0;
          
          // Check if units match or need conversion
          if (inventoryItem.unit === ingredient.unit) {
            possibleServings = Math.floor(inventoryItem.quantity / ingredient.quantityPerDish);
            console.log(`  🧮 Direct calculation: ${inventoryItem.quantity} ÷ ${ingredient.quantityPerDish} = ${possibleServings} servings`);
          } else {
            console.log(`  ⚠️ Unit mismatch: inventory has "${inventoryItem.unit}", recipe needs "${ingredient.unit}"`);
            
            // Try unit conversion
            const { convertUnits } = require('./posInventoryIntegration');
            try {
              const convertedQuantityPerDish = convertUnits(
                ingredient.quantityPerDish, 
                ingredient.unit, 
                inventoryItem.unit
              );
              
              console.log(`  🔄 Converting ${ingredient.quantityPerDish} ${ingredient.unit} to ${convertedQuantityPerDish} ${inventoryItem.unit}`);
              
              if (convertedQuantityPerDish > 0) {
                possibleServings = Math.floor(inventoryItem.quantity / convertedQuantityPerDish);
                console.log(`  🧮 After conversion: ${inventoryItem.quantity} ÷ ${convertedQuantityPerDish} = ${possibleServings} servings`);
              } else {
                console.log(`  ❌ Conversion failed or returned 0`);
                possibleServings = 0;
              }
            } catch (convError) {
              console.log(`  ❌ Unit conversion error:`, convError);
              possibleServings = 0;
            }
          }
          
          if (possibleServings <= 0) {
            console.log(`  ❌ PROBLEM: Not enough ingredients! Need ${ingredient.quantityPerDish} ${ingredient.unit} but only have ${inventoryItem.quantity} ${inventoryItem.unit}`);
            limitingFactor = 0;
            limitingIngredient = ingredient.inventoryItemName;
          } else if (possibleServings < limitingFactor) {
            console.log(`  ⚠️ This ingredient is the limiting factor! Only ${possibleServings} servings possible`);
            limitingFactor = possibleServings;
            limitingIngredient = ingredient.inventoryItemName;
          } else {
            console.log(`  ✅ Sufficient stock: ${possibleServings} servings possible`);
          }
        } else {
          console.log(`  ❌ NOT FOUND in inventory`);
          console.log(`  🔍 Available inventory items:`, inventory.map((item: any) => `"${item.name}"`));
          
          // Try fuzzy search
          const fuzzyMatches = inventory.filter((item: any) => 
            item.name.toLowerCase().includes(ingredient.inventoryItemName.toLowerCase()) ||
            ingredient.inventoryItemName.toLowerCase().includes(item.name.toLowerCase())
          );
          
          if (fuzzyMatches.length > 0) {
            console.log(`  🔄 Possible matches:`, fuzzyMatches.map((item: any) => item.name));
          }
          
          limitingFactor = 0;
          limitingIngredient = ingredient.inventoryItemName + ' (not found)';
        }
      } else {
        console.log(`  ⚠️ Ingredient not in expected format:`, ingredientSpec);
      }
    });
    
    console.log('\n🎯 FINAL CALCULATION SUMMARY:');
    console.log(`🎯 Limiting factor: ${limitingFactor === Infinity ? 'No limits' : limitingFactor} servings`);
    console.log(`🎯 Limited by: ${limitingIngredient || 'None'}`);
    
  } else {
    console.log('❌ No ingredients array found');
  }
  
  // Final validation using existing system
  console.log('\n🎯 Comparison with existing validateDishAvailability:');
  try {
    const validation = validateDishAvailability(userId, dish, 1);
    console.log('📊 System validation result:', validation);
    console.log('📊 Available quantity (servings):', validation.availableQuantity);
    console.log('📊 Is available:', validation.isAvailable);
    console.log('📊 Missing ingredients:', validation.missingIngredients);
  } catch (error) {
    console.log('❌ Validation failed:', error);
  }
  
  console.log('🧮 ===== END SERVINGS DEBUG =====');
}

// Function to clean menu item names by removing price information
function cleanMenuItemName(name: string): string {
  if (!name) return name;
  
  // Remove price patterns like "- 12.90 EUR", "- $12.90", "- 12.90", "- €12.90"
  return name
    .replace(/\s*-\s*\d+[\.,]\d+\s*(EUR|USD|GBP|€|\$|£)\s*$/i, '') // Remove "- 12.90 EUR" patterns
    .replace(/\s*-\s*\d+[\.,]\d+\s*$/i, '') // Remove "- 12.90" patterns  
    .replace(/\s*\(\d+[\.,]\d+\s*(EUR|USD|GBP|€|\$|£)\)\s*$/i, '') // Remove "(12.90 EUR)" patterns
    .replace(/\s*\$\d+[\.,]\d+\s*$/i, '') // Remove "$12.90" patterns
    .replace(/\s*€\d+[\.,]\d+\s*$/i, '') // Remove "€12.90" patterns
    .replace(/\s*£\d+[\.,]\d+\s*$/i, '') // Remove "£12.90" patterns
    .trim();
}
