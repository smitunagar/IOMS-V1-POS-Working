/**
 * 🍽️ SERVING AVAILABILITY SERVICE
 * ================================
 * This service handles real-time ingredient availability checking and serving limits.
 * 
 * KEY FEATURES:
 * - Calculates maximum servings possible for each dish
 * - Provides detailed availability messages
 * - Handles insufficient ingredient scenarios
 * - Tracks why dishes cannot be served
 */

import { InventoryItem, getInventory, recordIngredientUsage } from './inventoryService';
import { Dish, IngredientQuantity, getDishes } from './menuService';
import { addOrder, OrderItem } from './orderService';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface IngredientAvailabilityCheck {
  ingredientName: string;
  required: number;
  available: number;
  unit: string;
  isAvailable: boolean;
  maxServings: number;
  shortage: number; // How much is missing
}

export interface DishAvailabilityResult {
  dishId: string;
  dishName: string;
  canServe: boolean;
  maxServings: number;
  requestedServings: number;
  limitingIngredient?: string; // Which ingredient is the bottleneck
  availabilityMessage: string;
  ingredientChecks: IngredientAvailabilityCheck[];
  warnings: string[];
}

export interface OrderAvailabilityCheck {
  canCompleteOrder: boolean;
  availableDishes: DishAvailabilityResult[];
  unavailableDishes: DishAvailabilityResult[];
  totalMessage: string;
  suggestedAlternatives?: string[];
}

// ========================================
// CORE AVAILABILITY FUNCTIONS
// ========================================

/**
 * 🔍 MAIN FUNCTION: Check if a dish can be served with requested quantity
 */
export function checkDishServingAvailability(
  userId: string | null,
  dish: Dish,
  requestedServings: number = 1
): DishAvailabilityResult {
  console.log(`🍽️ ===== CHECKING SERVING AVAILABILITY =====`);
  console.log(`🍽️ Dish: ${dish.name}`);
  console.log(`🍽️ Requested servings: ${requestedServings}`);

  if (!userId || typeof window === 'undefined') {
    return createUnavailableResult(dish, requestedServings, 'System not available', []);
  }

  const inventory = getInventory(userId);
  const ingredientChecks: IngredientAvailabilityCheck[] = [];
  let maxPossibleServings = Infinity;
  let limitingIngredient = '';
  const warnings: string[] = [];

  // If no ingredients defined, assume dish is always available
  if (!dish.ingredients || dish.ingredients.length === 0) {
    console.log(`⚠️ No ingredients defined for ${dish.name} - assuming always available`);
    return {
      dishId: dish.id,
      dishName: dish.name,
      canServe: true,
      maxServings: 999,
      requestedServings,
      availabilityMessage: `✅ ${dish.name} is available (no ingredients tracking)`,
      ingredientChecks: [],
      warnings: ['No ingredients defined for this dish']
    };
  }

  // Check each ingredient
  dish.ingredients.forEach((ingredientSpec, index) => {
    if (typeof ingredientSpec === 'object' && 'inventoryItemName' in ingredientSpec) {
      const ingredient = ingredientSpec as IngredientQuantity;
      console.log(`  🔍 Checking ingredient ${index + 1}: ${ingredient.inventoryItemName}`);

      const check = checkSingleIngredientAvailability(
        inventory,
        ingredient.inventoryItemName,
        ingredient.quantityPerDish,
        ingredient.unit,
        requestedServings
      );

      ingredientChecks.push(check);

      if (check.maxServings < maxPossibleServings) {
        maxPossibleServings = check.maxServings;
        limitingIngredient = check.ingredientName;
      }

      if (!check.isAvailable) {
        warnings.push(`Insufficient ${check.ingredientName}: need ${check.required} ${check.unit}, have ${check.available} ${check.unit}`);
      }
    }
  });

  const canServe = maxPossibleServings >= requestedServings;
  const availabilityMessage = generateAvailabilityMessage(
    dish.name,
    canServe,
    requestedServings,
    maxPossibleServings,
    limitingIngredient
  );

  const result: DishAvailabilityResult = {
    dishId: dish.id,
    dishName: dish.name,
    canServe,
    maxServings: maxPossibleServings === Infinity ? 999 : Math.floor(maxPossibleServings),
    requestedServings,
    limitingIngredient: limitingIngredient || undefined,
    availabilityMessage,
    ingredientChecks,
    warnings
  };

  console.log(`🎯 Result: ${result.availabilityMessage}`);
  console.log(`🍽️ ===== END SERVING AVAILABILITY CHECK =====`);

  return result;
}

/**
 * 🔍 Check availability for a single ingredient
 */
function checkSingleIngredientAvailability(
  inventory: InventoryItem[],
  ingredientName: string,
  requiredPerServing: number,
  unit: string,
  requestedServings: number
): IngredientAvailabilityCheck {
  // Find the ingredient in inventory (with fuzzy matching)
  const inventoryItem = findInventoryItem(inventory, ingredientName);
  
  if (!inventoryItem) {
    return {
      ingredientName,
      required: requiredPerServing * requestedServings,
      available: 0,
      unit,
      isAvailable: false,
      maxServings: 0,
      shortage: requiredPerServing * requestedServings
    };
  }

  // Convert units if needed
  const convertedRequired = convertUnits(requiredPerServing, unit, inventoryItem.unit);
  const totalRequired = convertedRequired * requestedServings;
  const maxServings = Math.floor(inventoryItem.quantity / convertedRequired);

  return {
    ingredientName: inventoryItem.name,
    required: totalRequired,
    available: inventoryItem.quantity,
    unit: inventoryItem.unit,
    isAvailable: inventoryItem.quantity >= totalRequired,
    maxServings: maxServings,
    shortage: Math.max(0, totalRequired - inventoryItem.quantity)
  };
}

/**
 * 🔍 Find inventory item with fuzzy matching
 */
function findInventoryItem(inventory: InventoryItem[], searchName: string): InventoryItem | null {
  const cleanSearch = searchName.toLowerCase().trim();

  // Exact match first
  let found = inventory.find(item => item.name.toLowerCase().trim() === cleanSearch);
  if (found) return found;

  // Partial match
  found = inventory.find(item => {
    const itemName = item.name.toLowerCase().trim();
    return itemName.includes(cleanSearch) || cleanSearch.includes(itemName);
  });
  if (found) return found;

  // Word-by-word matching
  const searchWords = cleanSearch.split(' ');
  found = inventory.find(item => {
    const itemWords = item.name.toLowerCase().split(' ');
    return searchWords.some(searchWord => 
      itemWords.some(itemWord => 
        itemWord.includes(searchWord) || searchWord.includes(itemWord)
      )
    );
  });

  return found || null;
}

/**
 * 🔄 Simple unit conversion (extend as needed)
 */
function convertUnits(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit.toLowerCase() === toUnit.toLowerCase()) {
    return quantity;
  }

  const conversions: { [key: string]: { [key: string]: number } } = {
    'kg': { 'g': 1000, 'grams': 1000 },
    'g': { 'kg': 0.001, 'grams': 1 },
    'grams': { 'kg': 0.001, 'g': 1 },
    'l': { 'ml': 1000, 'milliliters': 1000 },
    'ml': { 'l': 0.001, 'milliliters': 1 },
    'milliliters': { 'l': 0.001, 'ml': 1 }
  };

  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();

  if (conversions[from] && conversions[from][to]) {
    return quantity * conversions[from][to];
  }

  console.warn(`Unit conversion not found: ${fromUnit} → ${toUnit}. Using 1:1 ratio.`);
  return quantity; // Fallback to 1:1 ratio
}

/**
 * 📝 Generate user-friendly availability message
 */
function generateAvailabilityMessage(
  dishName: string,
  canServe: boolean,
  requested: number,
  maxAvailable: number,
  limitingIngredient: string
): string {
  if (canServe) {
    if (maxAvailable >= 999) {
      return `✅ ${dishName} is available (${requested} servings requested)`;
    } else {
      return `✅ ${dishName} is available (${requested} servings requested, ${maxAvailable} total possible)`;
    }
  } else {
    if (maxAvailable === 0) {
      return `❌ Cannot serve ${dishName} - Missing ingredients${limitingIngredient ? ` (no ${limitingIngredient} available)` : ''}`;
    } else {
      return `❌ Cannot serve ${requested} servings of ${dishName} - Only ${maxAvailable} servings possible${limitingIngredient ? ` (limited by ${limitingIngredient})` : ''}`;
    }
  }
}

/**
 * 🏗️ Create unavailable result helper
 */
function createUnavailableResult(
  dish: Dish,
  requestedServings: number,
  reason: string,
  ingredientChecks: IngredientAvailabilityCheck[]
): DishAvailabilityResult {
  return {
    dishId: dish.id,
    dishName: dish.name,
    canServe: false,
    maxServings: 0,
    requestedServings,
    availabilityMessage: `❌ Cannot serve ${dish.name} - ${reason}`,
    ingredientChecks,
    warnings: [reason]
  };
}

// ========================================
// BATCH CHECKING FUNCTIONS
// ========================================

/**
 * 🍽️ Check availability for multiple dishes (full order)
 */
export function checkOrderAvailability(
  userId: string | null,
  orderItems: { dishId: string; quantity: number }[]
): OrderAvailabilityCheck {
  if (!userId) {
    return {
      canCompleteOrder: false,
      availableDishes: [],
      unavailableDishes: [],
      totalMessage: 'User not logged in',
    };
  }

  const dishes = getDishes(userId);
  const availableDishes: DishAvailabilityResult[] = [];
  const unavailableDishes: DishAvailabilityResult[] = [];

  orderItems.forEach(orderItem => {
    const dish = dishes.find(d => d.id === orderItem.dishId);
    if (dish) {
      const availability = checkDishServingAvailability(userId, dish, orderItem.quantity);
      
      if (availability.canServe) {
        availableDishes.push(availability);
      } else {
        unavailableDishes.push(availability);
      }
    }
  });

  const canCompleteOrder = unavailableDishes.length === 0;
  const totalMessage = generateOrderMessage(availableDishes, unavailableDishes);

  return {
    canCompleteOrder,
    availableDishes,
    unavailableDishes,
    totalMessage,
    suggestedAlternatives: generateAlternatives(unavailableDishes, dishes)
  };
}

/**
 * 📝 Generate order-level message
 */
function generateOrderMessage(
  available: DishAvailabilityResult[],
  unavailable: DishAvailabilityResult[]
): string {
  if (unavailable.length === 0) {
    return `✅ All ${available.length} dishes are available and can be prepared`;
  } else if (available.length === 0) {
    return `❌ None of the requested dishes can be prepared due to insufficient ingredients`;
  } else {
    return `⚠️ ${available.length} dishes available, ${unavailable.length} dishes cannot be prepared due to insufficient ingredients`;
  }
}

/**
 * 💡 Generate alternative suggestions
 */
function generateAlternatives(
  unavailable: DishAvailabilityResult[],
  allDishes: Dish[]
): string[] {
  // Simple logic: suggest dishes with fewer ingredients or similar categories
  const alternatives: string[] = [];
  
  unavailable.forEach(unavailableDish => {
    const similarDishes = allDishes.filter(dish => 
      dish.category === unavailableDish.dishName && 
      dish.id !== unavailableDish.dishId &&
      (!dish.ingredients || dish.ingredients.length <= 3) // Simpler dishes
    );
    
    if (similarDishes.length > 0) {
      alternatives.push(`Try ${similarDishes[0].name} instead of ${unavailableDish.dishName}`);
    }
  });

  return alternatives.slice(0, 3); // Limit to 3 suggestions
}

// ========================================
// ORDER PROCESSING WITH AVAILABILITY
// ========================================

/**
 * 🛒 Process order with automatic availability checking
 */
export function processOrderWithAvailabilityCheck(
  userId: string | null,
  orderItems: { dishId: string; quantity: number }[],
  tableInfo: { tableId: string; tableName: string }
): {
  success: boolean;
  orderId?: string;
  message: string;
  availabilityResults: DishAvailabilityResult[];
  unavailableItems: DishAvailabilityResult[];
} {
  if (!userId) {
    return {
      success: false,
      message: 'User not logged in',
      availabilityResults: [],
      unavailableItems: []
    };
  }

  // Check availability first
  const orderCheck = checkOrderAvailability(userId, orderItems);
  
  if (!orderCheck.canCompleteOrder) {
    return {
      success: false,
      message: `Order cannot be processed: ${orderCheck.totalMessage}`,
      availabilityResults: orderCheck.availableDishes,
      unavailableItems: orderCheck.unavailableDishes
    };
  }

  // If available, process the order and consume ingredients
  const dishes = getDishes(userId);
  const processedItems: OrderItem[] = [];
  let subtotal = 0;

  orderItems.forEach(orderItem => {
    const dish = dishes.find(d => d.id === orderItem.dishId);
    if (dish) {
      // Consume ingredients
      consumeIngredientsForDish(userId, dish, orderItem.quantity);
      
      // Add to order
      const totalPrice = dish.price * orderItem.quantity;
      processedItems.push({
        dishId: dish.id,
        name: dish.name,
        quantity: orderItem.quantity,
        unitPrice: dish.price,
        totalPrice
      });
      subtotal += totalPrice;
    }
  });

  // Create the order
  const order = addOrder(userId, {
    orderType: 'dine-in',
    table: tableInfo.tableName,
    tableId: tableInfo.tableId,
    items: processedItems,
    subtotal,
    taxRate: 0.1
  });

  return {
    success: true,
    orderId: order?.id,
    message: `✅ Order processed successfully! Ingredients consumed automatically.`,
    availabilityResults: orderCheck.availableDishes,
    unavailableItems: []
  };
}

/**
 * 🍽️ Consume ingredients for a dish
 */
function consumeIngredientsForDish(userId: string, dish: Dish, servings: number): void {
  if (!dish.ingredients || dish.ingredients.length === 0) {
    console.log(`No ingredients to consume for ${dish.name}`);
    return;
  }

  dish.ingredients.forEach(ingredientSpec => {
    if (typeof ingredientSpec === 'object' && 'inventoryItemName' in ingredientSpec) {
      const ingredient = ingredientSpec as IngredientQuantity;
      const totalQuantity = ingredient.quantityPerDish * servings;
      
      console.log(`🍽️ Consuming: ${totalQuantity} ${ingredient.unit} of ${ingredient.inventoryItemName} for ${servings} servings of ${dish.name}`);
      
      recordIngredientUsage(
        userId, 
        ingredient.inventoryItemName, 
        totalQuantity, 
        ingredient.unit
      );
    }
  });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * 📊 Get serving capacity for all menu items
 */
export function getMenuServingCapacity(userId: string | null): Array<{
  dishName: string;
  maxServings: number;
  limitingIngredient?: string;
  status: 'available' | 'limited' | 'unavailable';
}> {
  if (!userId) return [];

  const dishes = getDishes(userId);
  
  return dishes.map(dish => {
    const availability = checkDishServingAvailability(userId, dish, 1);
    
    let status: 'available' | 'limited' | 'unavailable' = 'available';
    if (availability.maxServings === 0) {
      status = 'unavailable';
    } else if (availability.maxServings <= 10) {
      status = 'limited';
    }

    return {
      dishName: dish.name,
      maxServings: availability.maxServings,
      limitingIngredient: availability.limitingIngredient,
      status
    };
  });
}

/**
 * 🔄 Reset ingredient usage (utility function)
 */
export function resetIngredientUsage(userId: string | null): void {
  if (!userId || typeof window === 'undefined') return;

  const inventory = getInventory(userId);
  const resetInventory = inventory.map(item => ({
    ...item,
    quantityUsed: 0
  }));

  localStorage.setItem(`restaurantInventory_${userId}`, JSON.stringify(resetInventory));
  console.log('✅ All ingredient usage counters reset to 0');
}
