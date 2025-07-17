// 🧠 Smart Inventory Integration Service
// This service checks ingredients against inventory and suggests additions

import { getInventory, addInventoryItem, InventoryItem } from './inventoryService';

export interface IngredientCheckResult {
  ingredientName: string;
  requiredQuantity: number;
  requiredUnit: string;
  status: 'found' | 'missing' | 'insufficient';
  inventoryItem?: InventoryItem;
  suggestion?: string;
  autoAddRecommendation?: {
    name: string;
    quantity: number;
    unit: string;
    category: string;
    lowStockThreshold: number;
  };
}

export interface DishInventoryAnalysis {
  dishName: string;
  totalIngredients: number;
  foundIngredients: number;
  missingIngredients: number;
  insufficientIngredients: number;
  results: IngredientCheckResult[];
  canMakeServings: number;
  recommendedInventoryAdditions: any[];
}

export interface MenuInventoryReport {
  totalDishes: number;
  dishesWithAllIngredients: number;
  dishesWithMissingIngredients: number;
  uniqueMissingIngredients: Set<string>;
  recommendations: any[];
  detailedAnalysis: DishInventoryAnalysis[];
}

/**
 * Enhanced fuzzy matching for ingredient names
 */
function findInventoryMatch(inventory: InventoryItem[], ingredientName: string): InventoryItem | null {
  const searchName = ingredientName.toLowerCase().trim();
  
  // 1. Exact match
  let match = inventory.find(item => item.name.toLowerCase().trim() === searchName);
  if (match) return match;
  
  // 2. Comprehensive synonym mapping
  const synonymMap: { [key: string]: string[] } = {
    // Proteins & Meat
    'chicken': ['chicken breast', 'chicken pieces', 'chicken meat'],
    'chicken breast': ['chicken', 'chicken pieces'],
    'beef': ['beef chunks', 'beef pieces', 'beef meat'],
    'mutton': ['lamb', 'goat meat', 'mutton pieces'],
    'fish': ['fish fillet', 'fish pieces'],
    'paneer': ['cottage cheese', 'indian cottage cheese'],
    'cottage cheese': ['paneer'],
    
    // Rice & Grains
    'basmati rice': ['rice', 'long grain rice'],
    'rice': ['basmati rice', 'long grain rice'],
    'wheat flour': ['flour', 'all-purpose flour', 'plain flour'],
    'flour': ['wheat flour', 'all-purpose flour'],
    'all-purpose flour': ['flour', 'plain flour', 'wheat flour'],
    
    // Vegetables
    'onion': ['onions', 'yellow onion'],
    'onions': ['onion', 'yellow onion'],
    'tomato': ['tomatoes', 'fresh tomatoes'],
    'tomatoes': ['tomato', 'fresh tomatoes'],
    'potato': ['potatoes'],
    'potatoes': ['potato'],
    'green chili': ['green chilies', 'green chilli'],
    'green chilies': ['green chili', 'green chilli'],
    'ginger': ['fresh ginger', 'ginger root'],
    'garlic': ['fresh garlic', 'garlic cloves'],
    'coriander': ['cilantro', 'fresh coriander', 'coriander leaves'],
    'cilantro': ['coriander', 'fresh coriander'],
    
    // Spices & Seasonings
    'ginger garlic paste': ['ginger-garlic paste'],
    'red chili powder': ['chili powder', 'red chilli powder'],
    'chili powder': ['red chili powder', 'red chilli powder'],
    'turmeric powder': ['turmeric', 'haldi'],
    'turmeric': ['turmeric powder', 'haldi'],
    'cumin powder': ['ground cumin', 'cumin'],
    'coriander powder': ['ground coriander'],
    'garam masala': ['garam masala powder'],
    'black pepper': ['pepper', 'black pepper powder'],
    'mustard seeds': ['mustard seed'],
    'cumin seeds': ['cumin seed', 'jeera'],
    'bay leaves': ['bay leaf'],
    'cardamom': ['green cardamom', 'elaichi'],
    'cinnamon': ['cinnamon stick'],
    'cloves': ['clove'],
    
    // Dairy & Liquids
    'milk': ['whole milk', 'fresh milk'],
    'yogurt': ['curd', 'plain yogurt', 'dahi'],
    'curd': ['yogurt', 'dahi'],
    'ghee': ['clarified butter'],
    'oil': ['cooking oil', 'vegetable oil'],
    'cooking oil': ['oil', 'vegetable oil'],
    
    // Sugars & Sweeteners
    'sugar': ['granulated sugar', 'white sugar'],
    'granulated sugar': ['sugar', 'white sugar'],
    'jaggery': ['gur', 'brown sugar'],
    
    // Nuts & Dry Fruits
    'cashews': ['cashew nuts', 'kaju'],
    'almonds': ['almond', 'badam'],
    'raisins': ['kishmish', 'dry grapes']
  };
  
  // Check synonyms
  const synonyms = synonymMap[searchName] || [];
  for (const synonym of synonyms) {
    match = inventory.find(item => item.name.toLowerCase().trim() === synonym.toLowerCase().trim());
    if (match) return match;
  }
  
  // Reverse synonym check
  for (const [key, values] of Object.entries(synonymMap)) {
    if (values.includes(searchName)) {
      match = inventory.find(item => item.name.toLowerCase().trim() === key.toLowerCase().trim());
      if (match) return match;
    }
  }
  
  // 3. Partial matching
  match = inventory.find(item => {
    const itemName = item.name.toLowerCase().trim();
    return itemName.includes(searchName) || searchName.includes(itemName);
  });
  if (match) return match;
  
  // 4. Word-based matching
  const searchWords = searchName.split(/\s+/);
  for (const item of inventory) {
    const itemWords = item.name.toLowerCase().split(/\s+/);
    const hasCommonWord = searchWords.some(searchWord => 
      itemWords.some(itemWord => 
        itemWord.includes(searchWord) || searchWord.includes(itemWord)
      )
    );
    if (hasCommonWord) return item;
  }
  
  return null;
}

/**
 * Get category suggestion based on ingredient name
 */
function suggestCategory(ingredientName: string): string {
  const name = ingredientName.toLowerCase();
  
  if (name.includes('chicken') || name.includes('beef') || name.includes('mutton') || 
      name.includes('lamb') || name.includes('fish') || name.includes('meat')) {
    return 'Meat';
  }
  
  if (name.includes('rice') || name.includes('flour') || name.includes('bread') || 
      name.includes('pasta') || name.includes('quinoa')) {
    return 'Grains';
  }
  
  if (name.includes('onion') || name.includes('tomato') || name.includes('potato') || 
      name.includes('carrot') || name.includes('capsicum') || name.includes('spinach') ||
      name.includes('coriander') || name.includes('mint') || name.includes('chili')) {
    return 'Produce';
  }
  
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || 
      name.includes('butter') || name.includes('cream') || name.includes('paneer')) {
    return 'Dairy';
  }
  
  if (name.includes('powder') || name.includes('masala') || name.includes('seeds') ||
      name.includes('turmeric') || name.includes('cumin') || name.includes('pepper') ||
      name.includes('cardamom') || name.includes('cinnamon') || name.includes('cloves')) {
    return 'Spices';
  }
  
  if (name.includes('oil') || name.includes('ghee') || name.includes('vinegar')) {
    return 'Oils & Condiments';
  }
  
  return 'Pantry';
}

/**
 * Get suggested quantity based on ingredient type
 */
function suggestQuantity(ingredientName: string, requiredQuantity: number): number {
  const name = ingredientName.toLowerCase();
  
  // For meats, suggest enough for 10-15 servings
  if (name.includes('chicken') || name.includes('beef') || name.includes('mutton')) {
    return Math.max(requiredQuantity * 12, 1000); // At least 1kg
  }
  
  // For rice/grains, suggest bulk quantity
  if (name.includes('rice') || name.includes('flour')) {
    return Math.max(requiredQuantity * 20, 2000); // At least 2kg
  }
  
  // For vegetables, suggest moderate quantity
  if (name.includes('onion') || name.includes('tomato') || name.includes('potato')) {
    return Math.max(requiredQuantity * 15, 500); // At least 500g
  }
  
  // For spices, suggest small quantity
  if (name.includes('powder') || name.includes('masala') || name.includes('seeds')) {
    return Math.max(requiredQuantity * 25, 50); // At least 50g
  }
  
  // For liquids
  if (name.includes('oil') || name.includes('milk')) {
    return Math.max(requiredQuantity * 10, 500); // At least 500ml
  }
  
  // Default: 10 times the required amount
  return Math.max(requiredQuantity * 10, 100);
}

/**
 * Analyze a single dish's ingredients against inventory
 */
export function analyzeDishIngredients(
  userId: string,
  dishName: string,
  ingredients: any[]
): DishInventoryAnalysis {
  console.log(`🔍 Analyzing dish: ${dishName}`);
  console.log(`📋 Ingredients to analyze:`, ingredients);
  
  try {
    const inventory = getInventory(userId);
    console.log(`📦 Available inventory items:`, inventory.map(item => `${item.name} (${item.quantity} ${item.unit})`));
    
    const results: IngredientCheckResult[] = [];
    const recommendations: any[] = [];
    
    let foundCount = 0;
    let missingCount = 0;
    let insufficientCount = 0;
    let minServings = Infinity;
    
    for (const ingredient of ingredients) {
      const ingredientName = ingredient.inventoryItemName || ingredient.name;
      const requiredQty = ingredient.quantityPerDish || ingredient.quantity || 0;
      const requiredUnit = ingredient.unit || 'g';
      
      console.log(`🔍 Checking ingredient: ${ingredientName} (need: ${requiredQty} ${requiredUnit})`);
      
      const inventoryMatch = findInventoryMatch(inventory, ingredientName);
      console.log(`🔍 Match result:`, inventoryMatch ? `Found: ${inventoryMatch.name}` : 'Not found');
      
      if (!inventoryMatch) {
        // Missing ingredient
        missingCount++;
        minServings = 0;
        
        const suggestion = suggestQuantity(ingredientName, requiredQty);
        const category = suggestCategory(ingredientName);
        
        results.push({
          ingredientName,
          requiredQuantity: requiredQty,
          requiredUnit: requiredUnit,
          status: 'missing',
          suggestion: `Add ${suggestion} ${requiredUnit} to inventory`,
          autoAddRecommendation: {
            name: ingredientName,
            quantity: suggestion,
            unit: requiredUnit,
            category: category,
            lowStockThreshold: Math.max(Math.floor(suggestion * 0.2), 1)
          }
        });
        
        recommendations.push({
          type: 'missing',
          ingredientName,
          suggestion: `Add ${suggestion} ${requiredUnit} of ${ingredientName}`,
          autoAdd: true,
          name: ingredientName,
          quantity: suggestion,
          unit: requiredUnit,
          category: category,
          lowStockThreshold: Math.max(Math.floor(suggestion * 0.2), 1)
        });
      } else {
        // Found ingredient - check if sufficient
        const availableQty = inventoryMatch.quantity;
        const possibleServings = Math.floor(availableQty / requiredQty);
        
        console.log(`📊 ${ingredientName}: ${availableQty} available ÷ ${requiredQty} needed = ${possibleServings} servings`);
        
        if (possibleServings === 0) {
          insufficientCount++;
          minServings = 0;
          
          results.push({
            ingredientName,
            requiredQuantity: requiredQty,
            requiredUnit: requiredUnit,
            status: 'insufficient',
            inventoryItem: inventoryMatch,
            suggestion: `Need ${requiredQty} ${requiredUnit}, but only ${availableQty} ${inventoryMatch.unit} available`
          });
        } else {
          foundCount++;
          minServings = Math.min(minServings, possibleServings);
          
          results.push({
            ingredientName,
            requiredQuantity: requiredQty,
            requiredUnit: requiredUnit,
            status: 'found',
            inventoryItem: inventoryMatch,
            suggestion: `✅ Available (${possibleServings} servings possible)`
          });
        }
      }
    }
    
    const analysis = {
      dishName,
      totalIngredients: ingredients.length,
      foundIngredients: foundCount,
      missingIngredients: missingCount,
      insufficientIngredients: insufficientCount,
      results,
      canMakeServings: minServings === Infinity ? 0 : minServings,
      recommendedInventoryAdditions: recommendations
    };
    
    console.log(`✅ Analysis complete for ${dishName}:`, analysis);
    return analysis;
  } catch (error) {
    console.error(`❌ Error analyzing dish ${dishName}:`, error);
    throw error;
  }
}

/**
 * Analyze entire menu against inventory
 */
export function analyzeMenuInventory(userId: string, menu: any[]): MenuInventoryReport {
  console.log('🧠 Starting menu inventory analysis...');
  console.log('📋 Menu to analyze:', menu.map(dish => `${dish.name} (${dish.ingredients?.length || 0} ingredients)`));
  
  try {
    const detailedAnalysis: DishInventoryAnalysis[] = [];
    const allMissingIngredients = new Set<string>();
    const allRecommendations: any[] = [];
    
    let dishesWithAllIngredients = 0;
    let dishesWithMissingIngredients = 0;
    
    for (const dish of menu) {
      if (!dish.ingredients || dish.ingredients.length === 0) {
        console.log(`⚠️ Skipping ${dish.name} - no ingredients`);
        continue;
      }
      
      console.log(`🔍 Analyzing dish: ${dish.name}`);
      const analysis = analyzeDishIngredients(userId, dish.name, dish.ingredients);
      detailedAnalysis.push(analysis);
      
      if (analysis.missingIngredients === 0 && analysis.insufficientIngredients === 0) {
        dishesWithAllIngredients++;
        console.log(`✅ ${dish.name}: All ingredients available`);
      } else {
        dishesWithMissingIngredients++;
        console.log(`❌ ${dish.name}: Missing ${analysis.missingIngredients}, Insufficient ${analysis.insufficientIngredients}`);
      }
      
      // Collect missing ingredients
      analysis.results.forEach(result => {
        if (result.status === 'missing') {
          allMissingIngredients.add(result.ingredientName);
          if (result.autoAddRecommendation) {
            // Avoid duplicates
            const existing = allRecommendations.find(r => r.name === result.autoAddRecommendation!.name);
            if (!existing) {
              allRecommendations.push(result.autoAddRecommendation);
            }
          }
        }
      });
    }
    
    const report = {
      totalDishes: menu.length,
      dishesWithAllIngredients,
      dishesWithMissingIngredients,
      uniqueMissingIngredients: allMissingIngredients,
      recommendations: allRecommendations,
      detailedAnalysis
    };
    
    console.log('📊 Final analysis report:', report);
    return report;
  } catch (error) {
    console.error('❌ Error in analyzeMenuInventory:', error);
    throw new Error(`Menu analysis failed: ${error.message}`);
  }
}

/**
 * Auto-add recommended ingredients to inventory
 */
export function autoAddRecommendedIngredients(userId: string, recommendations: any[]): {
  added: number;
  failed: number;
  details: string[];
} {
  let added = 0;
  let failed = 0;
  const details: string[] = [];
  
  for (const rec of recommendations) {
    try {
      const newItem = addInventoryItem(userId, {
        name: rec.name,
        quantity: rec.quantity,
        unit: rec.unit,
        category: rec.category,
        lowStockThreshold: rec.lowStockThreshold,
        expiryDate: undefined,
        image: 'https://placehold.co/60x60.png',
        aiHint: rec.name.toLowerCase()
      });
      
      if (newItem) {
        added++;
        details.push(`✅ Added ${rec.name}: ${rec.quantity} ${rec.unit}`);
      } else {
        failed++;
        details.push(`❌ Failed to add ${rec.name}`);
      }
    } catch (error) {
      failed++;
      details.push(`❌ Error adding ${rec.name}: ${error}`);
    }
  }
  
  return { added, failed, details };
}
