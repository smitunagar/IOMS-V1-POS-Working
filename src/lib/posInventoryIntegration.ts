// Enhanced Inventory Service for POS Integration
// This file extends the existing inventory service with POS-specific functionality

import { InventoryItem, getInventory, recordIngredientUsage as originalRecordUsage } from './inventoryService';
import { Dish, IngredientQuantity } from './menuService';

export interface StockValidationResult {
  isAvailable: boolean;
  availableQuantity: number;
  requiredQuantity: number;
  missingIngredients: string[];
  lowStockIngredients: string[];
}

export interface MenuAvailability {
  dishId: string;
  dishName: string;
  isAvailable: boolean;
  stockStatus: 'available' | 'low-stock' | 'out-of-stock';
  missingIngredients: string[];
  estimatedServings: number;
}

export interface IngredientCost {
  name: string;
  costPerUnit: number;
  totalCost: number;
  quantity: number;
  unit: string;
}

export interface OrderCostAnalysis {
  totalIngredientCost: number;
  costPerItem: IngredientCost[];
  profitMargin: number;
  foodCostPercentage: number;
}

/**
 * Validates if a dish can be prepared based on current inventory
 */
export function validateDishAvailability(
  userId: string | null, 
  dish: Dish, 
  quantity: number = 1
): StockValidationResult {
  console.log('🔍 ===== VALIDATE DISH AVAILABILITY =====');
  console.log('🔍 Dish:', dish.name);
  console.log('🔍 Quantity requested:', quantity);
  console.log('🔍 Dish ingredients:', dish.ingredients);
  
  if (!userId || typeof window === 'undefined') {
    console.log('❌ No user ID or not in browser');
    return {
      isAvailable: false,
      availableQuantity: 0,
      requiredQuantity: quantity,
      missingIngredients: [],
      lowStockIngredients: []
    };
  }

  const inventory = getInventory(userId);
  console.log('📦 Current inventory:', inventory.map(item => `${item.name}: ${item.quantity} ${item.unit}`));
  
  const missingIngredients: string[] = [];
  const lowStockIngredients: string[] = [];
  let maxServings = Infinity;

  if (!dish.ingredients || dish.ingredients.length === 0) {
    console.log('⚠️ No ingredients defined for dish');
    // If no ingredients defined, assume available
    return {
      isAvailable: true,
      availableQuantity: 999,
      requiredQuantity: quantity,
      missingIngredients: [],
      lowStockIngredients: []
    };
  }

  // Check each ingredient
  dish.ingredients.forEach((ingredientSpec, index) => {
    console.log(`🔍 Checking ingredient ${index + 1}:`, ingredientSpec);
    
    if (typeof ingredientSpec === 'object' && 'inventoryItemName' in ingredientSpec) {
      const ingredient = ingredientSpec as IngredientQuantity;
      console.log(`  📋 Looking for inventory item: "${ingredient.inventoryItemName}"`);
      
      const inventoryItem = findInventoryItemByName(inventory, ingredient.inventoryItemName);
      console.log(`    🔍 Enhanced search result:`, inventoryItem ? `Found: ${inventoryItem.name}` : 'Not found');

      if (!inventoryItem) {
        console.log(`  ❌ Inventory item not found: ${ingredient.inventoryItemName}`);
        missingIngredients.push(ingredient.inventoryItemName);
        maxServings = 0;
      } else {
        // 🔥 ENHANCED: Convert units if needed
        const convertedQuantityPerDish = convertUnits(
          ingredient.quantityPerDish, 
          ingredient.unit, 
          inventoryItem.unit
        );
        
        const requiredQuantity = convertedQuantityPerDish * quantity;
        const availableServings = Math.floor(inventoryItem.quantity / convertedQuantityPerDish);
        
        console.log(`  📊 Required: ${requiredQuantity} ${inventoryItem.unit} (converted from ${ingredient.quantityPerDish} ${ingredient.unit})`);
        console.log(`  📊 Available: ${inventoryItem.quantity} ${inventoryItem.unit}`);
        console.log(`  📊 Available servings: ${availableServings}`);
        
        if (inventoryItem.quantity < requiredQuantity) {
          console.log(`  ❌ Insufficient stock for ${ingredient.inventoryItemName}`);
          missingIngredients.push(ingredient.inventoryItemName);
          maxServings = 0;
        } else {
          maxServings = Math.min(maxServings, availableServings);
          
          // Check if low stock
          if (inventoryItem.quantity <= inventoryItem.lowStockThreshold) {
            console.log(`  ⚠️ Low stock for ${ingredient.inventoryItemName}`);
            lowStockIngredients.push(ingredient.inventoryItemName);
          }
        }
      }
    } else {
      console.log('  ⚠️ Ingredient not in expected format:', ingredientSpec);
    }
  });

  const result = {
    isAvailable: missingIngredients.length === 0,
    availableQuantity: maxServings === Infinity ? 999 : maxServings,
    requiredQuantity: quantity,
    missingIngredients,
    lowStockIngredients
  };
  
  console.log('🎯 Final availability result:', result);
  console.log('🔍 ===== END VALIDATE DISH AVAILABILITY =====');
  
  return result;
}

/**
 * Gets availability status for all menu dishes
 */
export function getMenuAvailability(userId: string | null, dishes: Dish[]): MenuAvailability[] {
  return dishes.map(dish => {
    const validation = validateDishAvailability(userId, dish, 1);
    
    let stockStatus: 'available' | 'low-stock' | 'out-of-stock' = 'available';
    if (!validation.isAvailable) {
      stockStatus = 'out-of-stock';
    } else if (validation.lowStockIngredients.length > 0) {
      stockStatus = 'low-stock';
    }

    return {
      dishId: dish.id,
      dishName: dish.name,
      isAvailable: validation.isAvailable,
      stockStatus,
      missingIngredients: validation.missingIngredients,
      estimatedServings: validation.availableQuantity
    };
  });
}

/**
 * Calculates ingredient costs for a dish
 */
export function calculateDishCost(
  userId: string | null, 
  dish: Dish, 
  quantity: number = 1
): OrderCostAnalysis {
  if (!userId || typeof window === 'undefined') {
    return {
      totalIngredientCost: 0,
      costPerItem: [],
      profitMargin: 0,
      foodCostPercentage: 0
    };
  }

  const inventory = getInventory(userId);
  const costPerItem: IngredientCost[] = [];
  let totalIngredientCost = 0;

  if (dish.ingredients && dish.ingredients.length > 0) {
    dish.ingredients.forEach(ingredientSpec => {
      if (typeof ingredientSpec === 'object' && 'inventoryItemName' in ingredientSpec) {
        const ingredient = ingredientSpec as IngredientQuantity;
        const inventoryItem = inventory.find(
          item => item.name.toLowerCase() === ingredient.inventoryItemName.toLowerCase()
        );

        if (inventoryItem) {
          // Estimate cost per unit (this would come from purchase data in a real system)
          const estimatedCostPerUnit = 2.50; // Placeholder - should be from inventory item
          const totalQuantity = ingredient.quantityPerDish * quantity;
          const totalCost = totalQuantity * estimatedCostPerUnit;

          costPerItem.push({
            name: ingredient.inventoryItemName,
            costPerUnit: estimatedCostPerUnit,
            totalCost,
            quantity: totalQuantity,
            unit: ingredient.unit
          });

          totalIngredientCost += totalCost;
        }
      }
    });
  }

  const dishPrice = typeof dish.price === 'number' ? dish.price : parseFloat(String(dish.price) || '0');
  const revenue = dishPrice * quantity;
  const profitMargin = revenue - totalIngredientCost;
  const foodCostPercentage = revenue > 0 ? (totalIngredientCost / revenue) * 100 : 0;

  return {
    totalIngredientCost,
    costPerItem,
    profitMargin,
    foodCostPercentage
  };
}

/**
 * Enhanced ingredient usage recording with validation
 */
export function recordIngredientUsageWithValidation(
  userId: string | null,
  dish: Dish,
  quantity: number
): { success: boolean; warnings: string[]; detailedLog: string[] } {
  console.log('🍽️ ===== RECORDING INGREDIENT USAGE =====');
  console.log('🍽️ Dish:', dish.name);
  console.log('🍽️ Order quantity:', quantity);
  console.log('🥘 Raw ingredients data:', dish.ingredients);
  
  const warnings: string[] = [];
  const detailedLog: string[] = [];
  detailedLog.push(`🍽️ Processing order: ${quantity}x ${dish.name}`);
  
  // 🔥 ENHANCED: Handle multiple ingredient formats
  const normalizedIngredients = normalizeIngredientFormats(dish.ingredients, dish.name);
  console.log('🔄 Normalized ingredients:', normalizedIngredients);
  detailedLog.push(`📋 Found ${normalizedIngredients.length} normalized ingredients`);

  // Validate availability but don't block recording - just warn
  const validation = validateDishAvailability(userId, { ...dish, ingredients: normalizedIngredients }, quantity);
  console.log('✅ Validation result:', validation);
  
  if (!validation.isAvailable) {
    console.log('⚠️ Dish has availability issues, but proceeding with recording...');
    warnings.push(`Availability warning: Missing ingredients: ${validation.missingIngredients.join(', ')}`);
    detailedLog.push(`⚠️ Availability issues detected`);
  }

  let successfullyRecorded = 0;
  let totalIngredients = normalizedIngredients.length;

  // Record usage for each normalized ingredient
  if (normalizedIngredients.length > 0) {
    console.log('📝 Recording usage for', normalizedIngredients.length, 'ingredients');
    detailedLog.push(`📝 Starting deduction for ${normalizedIngredients.length} ingredients`);
    
    normalizedIngredients.forEach((ingredient, index) => {
      const totalConsumed = ingredient.quantityPerDish * quantity;
      console.log(`📉 [${index + 1}/${normalizedIngredients.length}] Deducting ${totalConsumed} ${ingredient.unit} of "${ingredient.inventoryItemName}"`);
      detailedLog.push(`📉 ${ingredient.inventoryItemName}: ${totalConsumed} ${ingredient.unit} (${ingredient.quantityPerDish} × ${quantity})`);
      
      try {
        // Enhanced inventory deduction with smart matching
        const deductionResult = deductFromInventoryWithSmartMatching(userId, ingredient.inventoryItemName, totalConsumed, ingredient.unit);
        
        if (deductionResult.success) {
          console.log('✅ Successfully recorded usage');
          detailedLog.push(`✅ Successfully deducted from "${deductionResult.matchedItemName}"`);
          successfullyRecorded++;
        } else {
          console.log('❌ Failed to find matching inventory item');
          detailedLog.push(`❌ No matching inventory item found for "${ingredient.inventoryItemName}"`);
          warnings.push(`Ingredient not found in inventory: ${ingredient.inventoryItemName}`);
        }
      } catch (error) {
        console.log('❌ Failed to record usage:', error);
        detailedLog.push(`❌ Error: ${error}`);
        warnings.push(`Failed to record usage for ${ingredient.inventoryItemName}: ${error}`);
      }
    });
  } else {
    console.log('⚠️ No ingredients found for dish:', dish.name);
    warnings.push(`No ingredients mapped for dish: ${dish.name}`);
    detailedLog.push(`⚠️ No ingredients found - cannot deduct inventory`);
  }

  // Add low stock warnings
  if (validation.lowStockIngredients.length > 0) {
    warnings.push(`Low stock warning: ${validation.lowStockIngredients.join(', ')}`);
    detailedLog.push(`⚠️ Low stock: ${validation.lowStockIngredients.join(', ')}`);
  }

  const isSuccess = successfullyRecorded > 0;
  const successRate = totalIngredients > 0 ? (successfullyRecorded / totalIngredients * 100).toFixed(1) : '0';
  
  console.log(`🏁 FINAL RESULT:`);
  console.log(`   Success: ${isSuccess}`);
  console.log(`   Recorded: ${successfullyRecorded}/${totalIngredients} (${successRate}%)`);
  console.log(`   Warnings: ${warnings.length}`);
  
  detailedLog.push(`🏁 Result: ${successfullyRecorded}/${totalIngredients} ingredients processed (${successRate}% success rate)`);
  
  return {
    success: isSuccess,
    warnings,
    detailedLog
  };
}

/**
 * Get dishes that should be promoted due to expiring ingredients
 */
export function getExpiringIngredientDishes(userId: string | null, dishes: Dish[]): {
  dish: Dish;
  expiringIngredients: string[];
  daysUntilExpiry: number;
}[] {
  if (!userId || typeof window === 'undefined') return [];

  const inventory = getInventory(userId);
  const today = new Date();
  const result: { dish: Dish; expiringIngredients: string[]; daysUntilExpiry: number; }[] = [];

  dishes.forEach(dish => {
    const expiringIngredients: string[] = [];
    let minDaysUntilExpiry = Infinity;

    if (dish.ingredients && dish.ingredients.length > 0) {
      dish.ingredients.forEach(ingredientSpec => {
        if (typeof ingredientSpec === 'object' && 'inventoryItemName' in ingredientSpec) {
          const ingredient = ingredientSpec as IngredientQuantity;
          const inventoryItem = inventory.find(
            item => item.name.toLowerCase() === ingredient.inventoryItemName.toLowerCase()
          );

          if (inventoryItem && inventoryItem.expiryDate) {
            const expiryDate = new Date(inventoryItem.expiryDate);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 3) { // Within 3 days
              expiringIngredients.push(inventoryItem.name);
              minDaysUntilExpiry = Math.min(minDaysUntilExpiry, daysUntilExpiry);
            }
          }
        }
      });
    }

    if (expiringIngredients.length > 0) {
      result.push({
        dish,
        expiringIngredients,
        daysUntilExpiry: minDaysUntilExpiry === Infinity ? 0 : minDaysUntilExpiry
      });
    }
  });

  return result.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

/**
 * Generate inventory usage report for a time period
 */
export function generateUsageReport(userId: string | null, startDate: Date, endDate: Date) {
  // This would integrate with order history to provide detailed usage analytics
  // For now, return a placeholder structure
  return {
    totalOrders: 0,
    mostUsedIngredients: [],
    leastUsedIngredients: [],
    wasteAnalysis: {
      expiredItems: [],
      totalWasteValue: 0
    },
    recommendations: []
  };
}

/**
 * 🔥 NEW: Enhanced ingredient name matching to handle common variations
 */
function findInventoryItemByName(inventory: any[], searchName: string): any | null {
  if (!inventory || !searchName) return null;
  
  const normalizedSearch = searchName.toLowerCase().trim();
  
  // Direct match first
  let found = inventory.find(item => 
    item.name.toLowerCase().trim() === normalizedSearch
  );
  
  if (found) return found;
  
  // Try common variations and synonyms
  const synonyms: { [key: string]: string[] } = {
    'paneer': ['cottage cheese', 'cheese', 'indian cottage cheese'],
    'cottage cheese': ['paneer'],
    'ginger garlic paste': ['ginger-garlic paste', 'garlic ginger paste'],
    'ginger-garlic paste': ['ginger garlic paste', 'garlic ginger paste'],
    'green chili': ['green chilies', 'green chilli', 'green chillies'],
    'green chilies': ['green chili', 'green chilli', 'green chillies'],
    'tomato': ['tomatoes'],
    'tomatoes': ['tomato'],
    'onion': ['onions'],
    'onions': ['onion'],
  };
  
  // Check if search term has synonyms
  const searchSynonyms = synonyms[normalizedSearch] || [];
  for (const synonym of searchSynonyms) {
    found = inventory.find(item => 
      item.name.toLowerCase().trim() === synonym.toLowerCase().trim()
    );
    if (found) return found;
  }
  
  // Partial matching as last resort
  found = inventory.find(item => {
    const itemName = item.name.toLowerCase().trim();
    return itemName.includes(normalizedSearch) || normalizedSearch.includes(itemName);
  });
  
  return found;
}

/**
 * 🔥 NEW: Enhanced unit conversion for common cooking units
 */
function convertUnits(fromAmount: number, fromUnit: string, toUnit: string): number {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();
  
  // If units are the same, return as-is
  if (from === to) return fromAmount;
  
  // Common conversion factors
  const conversions: { [key: string]: { [key: string]: number } } = {
    'kg': { 'g': 1000, 'grams': 1000, 'gram': 1000 },
    'g': { 'kg': 0.001, 'grams': 1, 'gram': 1 },
    'grams': { 'kg': 0.001, 'g': 1, 'gram': 1 },
    'gram': { 'kg': 0.001, 'g': 1, 'grams': 1 },
    'l': { 'ml': 1000, 'liters': 1, 'liter': 1 },
    'ml': { 'l': 0.001, 'liters': 0.001, 'liter': 0.001 },
    'cups': { 'ml': 240, 'cup': 1 },
    'cup': { 'ml': 240, 'cups': 1 },
    'tsp': { 'ml': 5, 'teaspoon': 1, 'teaspoons': 1 },
    'tbsp': { 'ml': 15, 'tablespoon': 1, 'tablespoons': 1 },
    'pcs': { 'pieces': 1, 'piece': 1, 'pc': 1 },
    'pieces': { 'pcs': 1, 'piece': 1, 'pc': 1 },
  };
  
  if (conversions[from] && conversions[from][to]) {
    return fromAmount * conversions[from][to];
  }
  
  // If no conversion found, assume they're compatible
  console.warn(`⚠️ No conversion found from ${fromUnit} to ${toUnit}, assuming 1:1 ratio`);
  return fromAmount;
}

/**
 * 🔄 ENHANCED: Normalize different ingredient formats into standard IngredientQuantity format
 */
function normalizeIngredientFormats(ingredients: any, dishName: string): IngredientQuantity[] {
  console.log('🔄 ===== NORMALIZING INGREDIENT FORMATS =====');
  console.log('🔄 Input ingredients:', ingredients);
  console.log('🔄 Input type:', typeof ingredients);
  console.log('🔄 Is array:', Array.isArray(ingredients));
  
  if (!ingredients) {
    console.log('❌ No ingredients provided');
    return [];
  }

  // Handle string format (legacy format)
  if (typeof ingredients === 'string') {
    console.log('📝 Converting string ingredients');
    const ingredientNames = ingredients.split(',').map(s => s.trim()).filter(s => s.length > 0);
    return ingredientNames.map(name => ({
      inventoryItemName: name,
      quantityPerDish: 100, // Default quantity
      unit: 'g' // Default unit
    }));
  }

  // Handle array format
  if (Array.isArray(ingredients)) {
    const normalized: IngredientQuantity[] = [];
    
    ingredients.forEach((ingredient, index) => {
      console.log(`🔄 Processing ingredient ${index + 1}:`, ingredient);
      
      // Format 1: Already in correct format {inventoryItemName, quantityPerDish, unit}
      if (typeof ingredient === 'object' && 'inventoryItemName' in ingredient) {
        console.log(`✅ Already in correct format`);
        normalized.push(ingredient as IngredientQuantity);
      }
      // Format 2: AI format {name, quantity, unit}
      else if (typeof ingredient === 'object' && 'name' in ingredient && 'quantity' in ingredient) {
        console.log(`🔄 Converting from AI format {name, quantity, unit}`);
        normalized.push({
          inventoryItemName: ingredient.name,
          quantityPerDish: ingredient.quantity,
          unit: ingredient.unit
        });
      }
      // Format 3: String format (ingredient names only)
      else if (typeof ingredient === 'string') {
        console.log(`🔄 Converting from string format`);
        normalized.push({
          inventoryItemName: ingredient,
          quantityPerDish: 100, // Default quantity
          unit: 'g' // Default unit
        });
      }
      // Format 4: Object with just name
      else if (typeof ingredient === 'object' && 'name' in ingredient) {
        console.log(`🔄 Converting from object with name only`);
        normalized.push({
          inventoryItemName: ingredient.name,
          quantityPerDish: 100, // Default quantity
          unit: 'g' // Default unit
        });
      }
      else {
        console.log(`⚠️ Unknown ingredient format:`, ingredient);
      }
    });
    
    console.log(`🔄 Normalized ${normalized.length} ingredients:`, normalized);
    return normalized;
  }

  console.log('❌ Unsupported ingredient format');
  return [];
}

/**
 * 🎯 ENHANCED: Smart inventory matching with fuzzy search and deduction
 */
function deductFromInventoryWithSmartMatching(
  userId: string | null, 
  ingredientName: string, 
  quantity: number, 
  unit: string
): { success: boolean; matchedItemName?: string; message?: string } {
  console.log(`🎯 Smart matching for: "${ingredientName}" (${quantity} ${unit})`);
  
  if (!userId || typeof window === 'undefined') {
    return { success: false, message: 'No user ID or not in browser' };
  }

  const inventory = getInventory(userId);
  console.log(`📦 Searching in ${inventory.length} inventory items`);
  
  // Try exact match first
  let matchedItem = inventory.find(item => 
    item.name.toLowerCase() === ingredientName.toLowerCase()
  );
  
  if (matchedItem) {
    console.log(`✅ Exact match found: "${matchedItem.name}"`);
  } else {
    // Try fuzzy matching with common synonyms
    console.log(`🔍 Trying fuzzy matching...`);
    matchedItem = findInventoryItemByName(inventory, ingredientName);
    
    if (matchedItem) {
      console.log(`✅ Fuzzy match found: "${matchedItem.name}" for "${ingredientName}"`);
    }
  }
  
  if (!matchedItem) {
    console.log(`❌ No match found for "${ingredientName}"`);
    return { success: false, message: `No inventory item found for "${ingredientName}"` };
  }
  
  // Deduct from inventory
  try {
    originalRecordUsage(userId, matchedItem.name, quantity, unit);
    console.log(`✅ Successfully deducted ${quantity} ${unit} from "${matchedItem.name}"`);
    return { success: true, matchedItemName: matchedItem.name };
  } catch (error) {
    console.log(`❌ Failed to deduct from "${matchedItem.name}":`, error);
    return { success: false, message: `Deduction failed: ${error}` };
  }
}
