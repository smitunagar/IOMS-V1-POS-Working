// Smart CSV Converter Service
// Automatically detects and converts any CSV format to system template
// Enhanced with intelligent category detection, unit standardization, and expiry prediction

export interface CSVField {
  originalName: string;
  suggestedMapping: string;
  confidence: number;
  isRequired: boolean;
}

export interface CSVAnalysis {
  detectedHeaders: string[];
  suggestedMappings: CSVField[];
  unmappedFields: Array<{
    originalName: string;
    possibleMappings: string[];
  }>;
  missingRequired: string[];
  confidence: number;
  preview: any[];
}

export interface ConversionResult {
  success: boolean;
  convertedData: any[];
  warnings: string[];
  mappingsUsed: Record<string, string>;
  intelligenceApplied: {
    categoriesDetected: number;
    unitsStandardized: number;
    expiryDatesGenerated: number;
    nutritionalDataAdded: number;
  };
}

// � SMART NAME CLEANING FUNCTION
// Removes price information from menu item names for proper inventory matching
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

// �🧠 SMART INGREDIENT CATEGORIES DATABASE
const INGREDIENT_CATEGORIES = {
  // Meat & Seafood
  'Meat & Seafood': [
    'beef', 'chicken', 'pork', 'lamb', 'turkey', 'duck', 'fish', 'salmon', 'tuna', 'cod',
    'shrimp', 'crab', 'lobster', 'meat', 'steak', 'ground beef', 'chicken breast', 'fish fillet'
  ],
  
  // Plant Proteins & Legumes
  'Plant Proteins': [
    'eggs', 'tofu', 'tempeh', 'seitan', 'beans', 'lentils', 'chickpeas', 'quinoa', 
    'nuts', 'almonds', 'peanuts', 'cashews', 'protein powder', 'black beans', 'kidney beans'
  ],
  
  // Dairy & Alternatives
  'Dairy': [
    'milk', 'cream', 'butter', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'yogurt',
    'sour cream', 'cottage cheese', 'ricotta', 'mascarpone', 'ghee', 'buttermilk',
    'almond milk', 'soy milk', 'oat milk', 'coconut milk', 'cashew milk'
  ],
  
  // Fresh Vegetables
  'Fresh Vegetables': [
    'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'bell pepper', 'broccoli',
    'cauliflower', 'spinach', 'lettuce', 'cabbage', 'zucchini', 'eggplant', 'cucumber',
    'mushroom', 'corn', 'peas', 'green beans', 'asparagus', 'kale', 'chard', 'leek'
  ],
  
  // Fresh Fruits
  'Fresh Fruits': [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry', 'raspberry',
    'grape', 'pineapple', 'mango', 'avocado', 'coconut', 'watermelon', 'cantaloupe',
    'peach', 'pear', 'cherry', 'plum', 'kiwi', 'papaya', 'passion fruit', 'dragon fruit'
  ],
  
  // Grains & Cereals
  'Grains & Cereals': [
    'rice', 'wheat', 'flour', 'bread', 'pasta', 'noodles', 'oats', 'barley', 'quinoa',
    'couscous', 'bulgur', 'cornmeal', 'semolina', 'buckwheat', 'millet', 'amaranth',
    'rye', 'spelt', 'teff', 'freekeh', 'farro', 'wild rice', 'brown rice', 'basmati'
  ],
  
  // Herbs & Spices
  'Herbs & Spices': [
    'salt', 'pepper', 'paprika', 'cumin', 'coriander', 'turmeric', 'ginger', 'cinnamon',
    'nutmeg', 'cloves', 'cardamom', 'bay leaves', 'thyme', 'rosemary', 'oregano', 'basil',
    'parsley', 'cilantro', 'dill', 'sage', 'tarragon', 'chili', 'cayenne', 'vanilla'
  ],
  
  // Cooking Oils & Fats
  'Cooking Oils': [
    'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil', 'avocado oil',
    'sunflower oil', 'peanut oil', 'grapeseed oil', 'walnut oil', 'flaxseed oil', 'lard',
    'shortening', 'margarine', 'cooking spray'
  ],
  
  // Baking Essentials
  'Baking Essentials': [
    'sugar', 'brown sugar', 'honey', 'maple syrup', 'agave', 'molasses', 'corn syrup',
    'baking powder', 'baking soda', 'yeast', 'vanilla extract', 'cocoa powder', 'chocolate',
    'chocolate chips', 'powdered sugar', 'stevia', 'xylitol', 'erythritol'
  ],
  
  // Beverages
  'Beverages': [
    'water', 'coffee', 'tea', 'juice', 'wine', 'beer', 'soda', 'energy drink', 'kombucha',
    'coconut water', 'sports drink', 'smoothie', 'protein shake'
  ],
  
  // Sauces & Condiments
  'Sauces & Condiments': [
    'ketchup', 'mustard', 'mayonnaise', 'soy sauce', 'worcestershire', 'hot sauce',
    'bbq sauce', 'ranch', 'caesar', 'vinegar', 'balsamic', 'apple cider vinegar',
    'fish sauce', 'oyster sauce', 'hoisin', 'sriracha', 'tahini', 'pesto'
  ],
  
  // Frozen Foods
  'Frozen Foods': [
    'frozen vegetables', 'frozen fruit', 'ice cream', 'frozen pizza', 'frozen meals',
    'frozen fish', 'frozen chicken', 'frozen berries', 'frozen peas', 'frozen corn'
  ]
};

// 🔄 SMART UNIT STANDARDIZATION
const UNIT_CONVERSIONS = {
  // Weight units (convert to kg for large amounts, g for small)
  'weight': {
    'grams': { standard: 'g', factor: 1 },
    'gram': { standard: 'g', factor: 1 },
    'g': { standard: 'g', factor: 1 },
    'kg': { standard: 'g', factor: 1000 },
    'kilogram': { standard: 'g', factor: 1000 },
    'kilograms': { standard: 'g', factor: 1000 },
    'pounds': { standard: 'g', factor: 453.592 },
    'pound': { standard: 'g', factor: 453.592 },
    'lbs': { standard: 'g', factor: 453.592 },
    'lb': { standard: 'g', factor: 453.592 },
    'ounces': { standard: 'g', factor: 28.3495 },
    'ounce': { standard: 'g', factor: 28.3495 },
    'oz': { standard: 'g', factor: 28.3495 }
  },
  
  // Volume units (convert to ml for small amounts, l for large)
  'volume': {
    'liters': { standard: 'ml', factor: 1000 },
    'liter': { standard: 'ml', factor: 1000 },
    'l': { standard: 'ml', factor: 1000 },
    'ml': { standard: 'ml', factor: 1 },
    'milliliters': { standard: 'ml', factor: 1 },
    'milliliter': { standard: 'ml', factor: 1 },
    'gallons': { standard: 'ml', factor: 3785.41 },
    'gallon': { standard: 'ml', factor: 3785.41 },
    'gal': { standard: 'ml', factor: 3785.41 },
    'quarts': { standard: 'ml', factor: 946.353 },
    'quart': { standard: 'ml', factor: 946.353 },
    'qt': { standard: 'ml', factor: 946.353 },
    'cups': { standard: 'ml', factor: 236.588 },
    'cup': { standard: 'ml', factor: 236.588 },
    'tablespoons': { standard: 'ml', factor: 14.7868 },
    'tablespoon': { standard: 'ml', factor: 14.7868 },
    'tbsp': { standard: 'ml', factor: 14.7868 },
    'teaspoons': { standard: 'ml', factor: 4.92892 },
    'teaspoon': { standard: 'ml', factor: 4.92892 },
    'tsp': { standard: 'ml', factor: 4.92892 }
  },
  
  // Count units
  'count': {
    'pieces': { standard: 'pcs', factor: 1 },
    'piece': { standard: 'pcs', factor: 1 },
    'pcs': { standard: 'pcs', factor: 1 },
    'pc': { standard: 'pcs', factor: 1 },
    'each': { standard: 'pcs', factor: 1 },
    'items': { standard: 'pcs', factor: 1 },
    'item': { standard: 'pcs', factor: 1 },
    'units': { standard: 'pcs', factor: 1 },
    'unit': { standard: 'pcs', factor: 1 },
    'dozen': { standard: 'pcs', factor: 12 },
    'dozens': { standard: 'pcs', factor: 12 }
  }
};

/**
 * 🧠 SMART UNIT OPTIMIZATION
 * Automatically chooses the best unit format (e.g., 5000g → 5kg, 2000ml → 2l)
 */
function optimizeUnit(quantity: number, unit: string): { quantity: number; unit: string } {
  // Weight optimization: convert to kg if >= 1000g
  if (unit === 'g' && quantity >= 1000) {
    return {
      quantity: Math.round((quantity / 1000) * 100) / 100, // Round to 2 decimal places
      unit: 'kg'
    };
  }
  
  // Volume optimization: convert to liters if >= 1000ml
  if (unit === 'ml' && quantity >= 1000) {
    return {
      quantity: Math.round((quantity / 1000) * 100) / 100,
      unit: 'l'
    };
  }
  
  // Convert back to grams for very small kg amounts (< 0.1kg)
  if (unit === 'kg' && quantity < 0.1) {
    return {
      quantity: Math.round(quantity * 1000),
      unit: 'g'
    };
  }
  
  // Convert back to ml for very small liter amounts (< 0.1l)
  if (unit === 'l' && quantity < 0.1) {
    return {
      quantity: Math.round(quantity * 1000),
      unit: 'ml'
    };
  }
  
  return { quantity, unit };
}

// 📅 SMART EXPIRY DATE PREDICTION
const EXPIRY_PREDICTIONS = {
  'Meat & Seafood': {
    fresh: { days: 3, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Store on bottom shelf, use FIFO rotation' },
    frozen: { days: 90, storage: 'frozen', temp: '0°F (-18°C)', tips: 'Vacuum seal for longer storage' },
    canned: { days: 365, storage: 'pantry', temp: 'room temperature', tips: 'Check for dents or rust' },
    dried: { days: 180, storage: 'pantry', temp: 'cool & dry', tips: 'Store in airtight containers' }
  },
  'Plant Proteins': {
    fresh: { days: 7, storage: 'pantry', temp: 'cool & dry', tips: 'Keep away from moisture' },
    dried: { days: 365, storage: 'pantry', temp: 'cool & dry', tips: 'Store in sealed containers' },
    canned: { days: 730, storage: 'pantry', temp: 'room temperature', tips: 'Great for emergency stock' }
  },
  'Dairy': {
    milk: { days: 7, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Keep in main body of fridge, not door' },
    cheese: { days: 30, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Wrap in wax paper, then plastic' },
    yogurt: { days: 14, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Check for separation or mold' },
    butter: { days: 60, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Can freeze for up to 6 months' }
  },
  'Fresh Vegetables': {
    leafy: { days: 7, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Store in crisper drawer with high humidity' },
    root: { days: 21, storage: 'cool_dry', temp: '50-60°F (10-15°C)', tips: 'Store in dark, well-ventilated area' },
    fresh: { days: 10, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Some prefer counter storage (tomatoes, onions)' },
    frozen: { days: 365, storage: 'frozen', temp: '0°F (-18°C)', tips: 'Blanch before freezing for best quality' }
  },
  'Fresh Fruits': {
    fresh: { days: 7, storage: 'cool_dry', temp: '60-70°F (15-21°C)', tips: 'Many ripen at room temperature first' },
    citrus: { days: 14, storage: 'cool_dry', temp: '60-70°F (15-21°C)', tips: 'Store at room temp, refrigerate when ripe' },
    berries: { days: 5, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Don\'t wash until ready to use' },
    frozen: { days: 365, storage: 'frozen', temp: '0°F (-18°C)', tips: 'Perfect for smoothies and baking' }
  },
  'Grains & Cereals': {
    dry: { days: 365, storage: 'pantry', temp: 'cool & dry', tips: 'Store in airtight containers to prevent pests' },
    cooked: { days: 3, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Cool quickly before refrigerating' },
    bread: { days: 7, storage: 'pantry', temp: 'room temperature', tips: 'Freeze for longer storage' }
  },
  'Herbs & Spices': {
    whole: { days: 1095, storage: 'pantry', temp: 'cool & dry', tips: 'Whole spices last 3x longer than ground' },
    ground: { days: 730, storage: 'pantry', temp: 'cool & dry', tips: 'Store in dark, airtight containers' },
    fresh: { days: 14, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Store like fresh flowers in water' }
  },
  'Cooking Oils': {
    refined: { days: 730, storage: 'pantry', temp: 'cool & dry', tips: 'Keep away from heat and light' },
    unrefined: { days: 365, storage: 'cool_dry', temp: '50-60°F (10-15°C)', tips: 'Refrigerate after opening' },
    coconut: { days: 540, storage: 'pantry', temp: 'room temperature', tips: 'Solid at room temp, melts at 76°F' }
  },
  'Baking Essentials': {
    dry: { days: 730, storage: 'pantry', temp: 'cool & dry', tips: 'Store in airtight containers' },
    liquid: { days: 365, storage: 'pantry', temp: 'room temperature', tips: 'Check dates on extracts regularly' },
    chocolate: { days: 365, storage: 'cool_dry', temp: '60-70°F (15-21°C)', tips: 'Avoid temperature fluctuations' }
  },
  'Beverages': {
    fresh: { days: 7, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Fresh juices spoil quickly' },
    shelf_stable: { days: 365, storage: 'pantry', temp: 'room temperature', tips: 'Refrigerate after opening' },
    alcohol: { days: 1825, storage: 'cool_dry', temp: '55-65°F (13-18°C)', tips: 'Store wine horizontally' }
  },
  'Sauces & Condiments': {
    opened: { days: 180, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Check labels - some need refrigeration' },
    unopened: { days: 730, storage: 'pantry', temp: 'room temperature', tips: 'Many last years when unopened' },
    vinegar: { days: 1825, storage: 'pantry', temp: 'room temperature', tips: 'Vinegar rarely spoils' }
  },
  'Frozen Foods': {
    vegetables: { days: 365, storage: 'frozen', temp: '0°F (-18°C)', tips: 'Use within 12 months for best quality' },
    meat: { days: 180, storage: 'frozen', temp: '0°F (-18°C)', tips: 'Label with date and type' },
    prepared: { days: 90, storage: 'frozen', temp: '0°F (-18°C)', tips: 'Reheat thoroughly before serving' }
  }
};

// System templates
export const INVENTORY_TEMPLATE = {
  required: ['Name', 'Quantity', 'Unit'],
  optional: ['Category', 'LowStockThreshold', 'ExpiryDate (YYYY-MM-DD)', 'ImageURL', 'SmartSuggestions'],
  headers: 'Name,Quantity,Unit,Category,LowStockThreshold,ExpiryDate (YYYY-MM-DD),ImageURL,SmartSuggestions'
};

export const MENU_TEMPLATE = {
  required: ['name', 'price'],
  optional: ['id', 'category', 'quantity', 'image', 'aiHint', 'ingredients'],
  headers: 'id,name,quantity,price,category,image,aiHint,ingredients'
};

// Smart field mapping dictionaries
const FIELD_MAPPINGS = {
  // Inventory mappings
  name: ['name', 'item', 'ingredient', 'product', 'title', 'item_name', 'product_name'],
  quantity: ['quantity', 'qty', 'amount', 'stock', 'count', 'opening_stock', 'current_stock', 'available'],
  unit: ['unit', 'units', 'measurement', 'uom', 'measure'],
  category: ['category', 'type', 'group', 'class', 'section'],
  lowStockThreshold: ['low_stock', 'threshold', 'minimum', 'min_stock', 'reorder_level'],
  expiryDate: ['expiry', 'expire', 'expiration', 'best_before', 'use_by', 'exp_date'],
  imageURL: ['image', 'img', 'photo', 'picture', 'url', 'image_url'],
  smartSuggestions: ['hint', 'description', 'notes', 'ai_hint', 'suggestion', 'desc'],
  
  // Menu mappings
  id: ['id', 'item_id', 'dish_id', 'menu_id', 'number'],
  price: ['price', 'cost', 'amount', 'rate', 'value'],
  ingredients: ['ingredients', 'recipe', 'components', 'items']
};

/**
 * 🧠 SMART CSV ANALYZER - Automatically detects CSV structure and suggests mappings
 */
export function analyzeCSV(csvContent: string, templateType: 'inventory' | 'menu'): CSVAnalysis {
  console.log('🔍 Analyzing CSV for', templateType, 'template');
  
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least header and one data row');
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const template = templateType === 'inventory' ? INVENTORY_TEMPLATE : MENU_TEMPLATE;
  
  console.log('📋 Detected headers:', headers);
  console.log('🎯 Target template:', template.required.concat(template.optional));
  
  const suggestedMappings: CSVField[] = [];
  const usedHeaders = new Set<string>();
  
  // First pass: Try to map required fields
  template.required.forEach(requiredField => {
    const mapping = findBestMatch(requiredField.toLowerCase(), headers, usedHeaders);
    if (mapping) {
      suggestedMappings.push({
        originalName: mapping.header,
        suggestedMapping: requiredField,
        confidence: mapping.confidence,
        isRequired: true
      });
      usedHeaders.add(mapping.header);
    }
  });
  
  // Second pass: Try to map optional fields
  template.optional.forEach(optionalField => {
    const mapping = findBestMatch(optionalField.toLowerCase(), headers, usedHeaders);
    if (mapping && mapping.confidence > 0.3) {
      suggestedMappings.push({
        originalName: mapping.header,
        suggestedMapping: optionalField,
        confidence: mapping.confidence,
        isRequired: false
      });
      usedHeaders.add(mapping.header);
    }
  });
  
  // Check for missing required fields
  const mappedRequired = suggestedMappings
    .filter(m => m.isRequired)
    .map(m => m.suggestedMapping);
  const missingRequired = template.required.filter(req => !mappedRequired.includes(req));
  
  // Calculate overall confidence
  const requiredMapped = template.required.length - missingRequired.length;
  const confidence = (requiredMapped / template.required.length) * 0.7 + 
                    (suggestedMappings.length / headers.length) * 0.3;
  
  // Generate preview data
  const preview = lines.slice(1, 4).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  
  // Generate unmapped fields (headers that couldn't be matched)
  const unmappedFields = headers
    .filter(header => !usedHeaders.has(header))
    .map(header => ({
      originalName: header,
      possibleMappings: [...template.required, ...template.optional]
    }));
  
  return {
    detectedHeaders: headers,
    suggestedMappings,
    unmappedFields,
    missingRequired,
    confidence,
    preview
  };
}

/**
 * 🎯 SMART FIELD MATCHER - Finds best matching field using multiple strategies
 */
function findBestMatch(targetField: string, headers: string[], usedHeaders: Set<string>): { header: string; confidence: number } | null {
  let bestMatch: { header: string; confidence: number } | null = null;
  
  headers.forEach(header => {
    if (usedHeaders.has(header)) return;
    
    const headerLower = header.toLowerCase();
    let confidence = 0;
    
    // Strategy 1: Exact match
    if (headerLower === targetField) {
      confidence = 1.0;
    }
    // Strategy 2: Check known synonyms
    else if (FIELD_MAPPINGS[targetField as keyof typeof FIELD_MAPPINGS]) {
      const synonyms = FIELD_MAPPINGS[targetField as keyof typeof FIELD_MAPPINGS];
      const exactSynonym = synonyms.find(s => s === headerLower);
      if (exactSynonym) {
        confidence = 0.9;
      } else {
        // Strategy 3: Partial match with synonyms
        const partialMatch = synonyms.find(s => 
          headerLower.includes(s) || s.includes(headerLower)
        );
        if (partialMatch) {
          confidence = 0.7;
        }
      }
    }
    // Strategy 4: Fuzzy string matching
    else {
      const similarity = calculateSimilarity(targetField, headerLower);
      if (similarity > 0.6) {
        confidence = similarity * 0.6;
      }
    }
    
    if (confidence > 0 && (!bestMatch || confidence > bestMatch.confidence)) {
      bestMatch = { header, confidence };
    }
  });
  
  return bestMatch;
}

/**
 * 📊 STRING SIMILARITY CALCULATOR
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * 🔄 SMART CSV CONVERTER - Converts any CSV to system template
 */
export function convertCSV(
  csvContent: string, 
  mappings: Record<string, string>, 
  templateType: 'inventory' | 'menu'
): ConversionResult {
  console.log('🔄 Converting CSV with smart intelligence:', mappings);
  
  const lines = csvContent.trim().split('\n');
  const originalHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const template = templateType === 'inventory' ? INVENTORY_TEMPLATE : MENU_TEMPLATE;
  
  const convertedData: any[] = [];
  const warnings: string[] = [];
  const intelligenceApplied = {
    categoriesDetected: 0,
    unitsStandardized: 0,
    expiryDatesGenerated: 0,
    nutritionalDataAdded: 0
  };
  
  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const convertedRow: any = {};
    
    // Apply mappings
    Object.entries(mappings).forEach(([originalField, targetField]) => {
      const originalIndex = originalHeaders.indexOf(originalField);
      if (originalIndex >= 0 && originalIndex < values.length) {
        let value = values[originalIndex];
        
        // Smart value conversion
        if (targetField.toLowerCase().includes('quantity') || targetField.toLowerCase().includes('threshold')) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            value = numValue.toString();
          }
        } else if (targetField.toLowerCase().includes('date')) {
          value = formatDate(value);
        } else if (targetField.toLowerCase().includes('price')) {
          value = formatPrice(value);
        }
        
        convertedRow[targetField] = value;
      }
    });
    
    // 🧠 APPLY SMART INTELLIGENCE
    if (templateType === 'inventory') {
      const rawItemName = convertedRow.Name || convertedRow.name || `Item ${i}`;
      const itemName = cleanMenuItemName(rawItemName); // Clean price information from names
      convertedRow.Name = itemName; // Update the cleaned name
      const originalUnit = convertedRow.Unit || 'pcs';
      const originalQuantity = parseFloat(convertedRow.Quantity || '0');

      // 1. Smart Category Detection
      if (!convertedRow.Category) {
        convertedRow.Category = detectIngredientCategory(itemName);
        intelligenceApplied.categoriesDetected++;
      }

      // 2. Smart Unit Standardization with Intelligent Optimization
      const unitResult = standardizeUnit(originalUnit, itemName);
      const convertedQuantity = originalQuantity * unitResult.conversionFactor;
      
      // Apply smart unit optimization (e.g., 5000g → 5kg)
      const optimizedUnit = optimizeUnit(convertedQuantity, unitResult.standardUnit);
      
      convertedRow.Unit = optimizedUnit.unit;
      convertedRow.Quantity = optimizedUnit.quantity.toString();
      
      // Add informative warnings/notes
      if (unitResult.warning) {
        warnings.push(`${itemName}: ${unitResult.warning}`);
      }
      
      if (optimizedUnit.unit !== unitResult.standardUnit) {
        warnings.push(`${itemName}: Optimized ${Math.round(convertedQuantity)}${unitResult.standardUnit} → ${optimizedUnit.quantity}${optimizedUnit.unit} for better readability`);
      }
      
      if (unitResult.standardUnit !== originalUnit || optimizedUnit.unit !== unitResult.standardUnit) {
        intelligenceApplied.unitsStandardized++;
      }

      // 3. Smart Expiry Date Prediction with detailed storage
      if (!convertedRow['ExpiryDate (YYYY-MM-DD)']) {
        const expiryData = predictExpiryDate(itemName, convertedRow.Category);
        convertedRow['ExpiryDate (YYYY-MM-DD)'] = expiryData.expiryDate;
        convertedRow.detailedStorage = expiryData.detailedStorage; // Add detailed storage info
        intelligenceApplied.expiryDatesGenerated++;
      }

      // 4. Smart Recommendations & Nutritional Data with detailed storage
      const recommendations = generateSmartRecommendations(itemName, convertedRow.Category, parseFloat(convertedRow.Quantity), convertedRow.Unit);
      const nutritionalData = enhanceWithNutritionalData(itemName, convertedRow.Category);
      const expiryData = predictExpiryDate(itemName, convertedRow.Category);
      
      // Create comprehensive smart suggestions with detailed storage info
      let smartSuggestions = recommendations.slice(0, 2).join(' | ');
      
      // Add detailed storage information
      smartSuggestions += ` | Storage: ${expiryData.detailedStorage.temperature}`;
      smartSuggestions += ` | Tips: ${expiryData.detailedStorage.tips}`;
      
      if (nutritionalData.allergens.length > 0) {
        smartSuggestions += ` | Allergens: ${nutritionalData.allergens.join(', ')}`;
        intelligenceApplied.nutritionalDataAdded++;
      }
      if (nutritionalData.isOrganic) {
        smartSuggestions += ' | Organic';
      }
      
      convertedRow.SmartSuggestions = smartSuggestions;

    } else if (templateType === 'menu') {
      const rawDishName = convertedRow.name || convertedRow.Name || `Dish ${i}`;
      const dishName = cleanMenuItemName(rawDishName); // Clean price information from dish names
      convertedRow.name = dishName; // Update the cleaned name
      convertedRow.Name = dishName; // Update both possible field names
      
      // Smart category detection for dishes
      if (!convertedRow.category) {
        if (dishName.toLowerCase().includes('cake') || dishName.toLowerCase().includes('dessert') || dishName.toLowerCase().includes('ice cream')) {
          convertedRow.category = 'Dessert';
        } else if (dishName.toLowerCase().includes('salad') || dishName.toLowerCase().includes('appetizer') || dishName.toLowerCase().includes('starter')) {
          convertedRow.category = 'Appetizer';
        } else if (dishName.toLowerCase().includes('main') || dishName.toLowerCase().includes('entree') || dishName.toLowerCase().includes('steak') || dishName.toLowerCase().includes('chicken')) {
          convertedRow.category = 'Main Course';
        } else if (dishName.toLowerCase().includes('drink') || dishName.toLowerCase().includes('beverage') || dishName.toLowerCase().includes('coffee') || dishName.toLowerCase().includes('tea')) {
          convertedRow.category = 'Beverage';
        } else if (dishName.toLowerCase().includes('soup')) {
          convertedRow.category = 'Soup';
        } else {
          convertedRow.category = 'General';
        }
        intelligenceApplied.categoriesDetected++;
      }
    }
    
    // Add default values for missing required fields
    template.required.forEach(field => {
      if (!convertedRow[field]) {
        convertedRow[field] = getDefaultValue(field);
        warnings.push(`Row ${i}: Missing required field '${field}', using default value`);
      }
    });
    
    // Add default values for optional fields if not present
    template.optional.forEach(field => {
      if (!convertedRow[field]) {
        convertedRow[field] = getDefaultValue(field);
      }
    });
    
    convertedData.push(convertedRow);
  }
  
  // Add intelligence summary to warnings
  if (intelligenceApplied.categoriesDetected > 0) {
    warnings.push(`🧠 Auto-detected ${intelligenceApplied.categoriesDetected} categories`);
  }
  if (intelligenceApplied.unitsStandardized > 0) {
    warnings.push(`🔄 Standardized ${intelligenceApplied.unitsStandardized} units`);
  }
  if (intelligenceApplied.expiryDatesGenerated > 0) {
    warnings.push(`📅 Generated ${intelligenceApplied.expiryDatesGenerated} expiry dates`);
  }
  if (intelligenceApplied.nutritionalDataAdded > 0) {
    warnings.push(`🥗 Added nutritional data for ${intelligenceApplied.nutritionalDataAdded} items`);
  }
  
  return {
    success: true,
    convertedData,
    warnings,
    mappingsUsed: mappings,
    intelligenceApplied
  };
}

/**
 * 📅 SMART VALUE FORMATTERS
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '2025-12-31';
  
  // Try to parse various date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return '2025-12-31';
}

function formatPrice(priceStr: string): string {
  if (!priceStr) return '0';
  
  const price = parseFloat(priceStr.replace(/[^\d.-]/g, ''));
  return isNaN(price) ? '0' : price.toString();
}

function getDefaultValue(field: string): string {
  const defaults: Record<string, string> = {
    // Inventory defaults
    'Name': 'Unknown Item',
    'Quantity': '0',
    'Unit': 'pcs',
    'Category': 'General',
    'LowStockThreshold': '10',
    'ExpiryDate (YYYY-MM-DD)': '2025-12-31',
    'ImageURL': '',
    'SmartSuggestions': '',
    
    // Menu defaults
    'id': Date.now().toString(),
    'name': 'Unknown Dish',
    'quantity': '',
    'price': '0',
    'category': 'General',
    'image': '',
    'aiHint': '',
    'ingredients': ''
  };
  
  return defaults[field] || '';
}

/**
 * 💾 GENERATE TEMPLATE CSV
 */
export function generateTemplateCSV(templateType: 'inventory' | 'menu'): string {
  const template = templateType === 'inventory' ? INVENTORY_TEMPLATE : MENU_TEMPLATE;
  return template.headers;
}

/**
 * 🧠 SMART CATEGORY DETECTION
 * Intelligently detects ingredient category based on name analysis
 */
function detectIngredientCategory(itemName: string): string {
  const nameLower = itemName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(INGREDIENT_CATEGORIES)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  // Fallback category detection using common patterns
  if (nameLower.includes('milk') || nameLower.includes('cream') || nameLower.includes('cheese')) return 'Dairy';
  if (nameLower.includes('meat') || nameLower.includes('beef') || nameLower.includes('chicken') || nameLower.includes('fish')) return 'Meat & Seafood';
  if (nameLower.includes('vegetable') || nameLower.includes('veggie')) return 'Fresh Vegetables';
  if (nameLower.includes('fruit')) return 'Fresh Fruits';
  if (nameLower.includes('spice') || nameLower.includes('herb') || nameLower.includes('seasoning')) return 'Herbs & Spices';
  if (nameLower.includes('oil') || nameLower.includes('fat')) return 'Cooking Oils';
  if (nameLower.includes('flour') || nameLower.includes('grain') || nameLower.includes('rice')) return 'Grains & Cereals';
  if (nameLower.includes('sauce') || nameLower.includes('dressing')) return 'Sauces & Condiments';
  if (nameLower.includes('frozen')) return 'Frozen Foods';
  if (nameLower.includes('drink') || nameLower.includes('beverage') || nameLower.includes('juice')) return 'Beverages';
  if (nameLower.includes('sugar') || nameLower.includes('flour') || nameLower.includes('baking')) return 'Baking Essentials';
  if (nameLower.includes('beans') || nameLower.includes('lentils') || nameLower.includes('tofu')) return 'Plant Proteins';
  
  return 'General'; // Default category
}

/**
 * 🔄 SMART UNIT STANDARDIZATION
 * Converts various unit formats to standardized units with intelligent optimization
 */
function standardizeUnit(unit: string, itemName: string): { 
  standardUnit: string; 
  conversionFactor: number; 
  warning?: string;
  optimizedQuantity?: number;
  originalUnit?: string;
} {
  const unitLower = unit.toLowerCase().trim();
  
  // Check all unit conversion tables
  for (const [type, conversions] of Object.entries(UNIT_CONVERSIONS)) {
    const conversionMap = conversions as Record<string, { standard: string; factor: number }>;
    if (conversionMap[unitLower]) {
      return {
        standardUnit: conversionMap[unitLower].standard,
        conversionFactor: conversionMap[unitLower].factor,
        originalUnit: unit
      };
    }
  }
  
  // Smart unit detection based on item name
  const nameLower = itemName.toLowerCase();
  
  // Liquids typically use volume units
  if (nameLower.includes('oil') || nameLower.includes('milk') || nameLower.includes('juice') || 
      nameLower.includes('sauce') || nameLower.includes('syrup') || nameLower.includes('vinegar')) {
    if (unitLower.includes('kg') || unitLower.includes('gram') || unitLower.includes('lb')) {
      return {
        standardUnit: 'ml',
        conversionFactor: 1,
        warning: `${itemName} is typically measured in volume (ml/l), but weight unit "${unit}" provided`,
        originalUnit: unit
      };
    }
    return { 
      standardUnit: unitLower.includes('ml') ? 'ml' : 'ml', 
      conversionFactor: unitLower.includes('l') ? 1000 : 1,
      originalUnit: unit
    };
  }
  
  // Spices and small quantities typically use grams
  if (nameLower.includes('spice') || nameLower.includes('extract') || nameLower.includes('powder')) {
    return { 
      standardUnit: 'g', 
      conversionFactor: 1,
      originalUnit: unit
    };
  }
  
  // Eggs, fruits often counted as pieces
  if (nameLower.includes('egg') || nameLower.includes('apple') || nameLower.includes('orange') ||
      nameLower.includes('lemon') || nameLower.includes('lime') || nameLower.includes('onion')) {
    return { 
      standardUnit: 'pcs', 
      conversionFactor: 1,
      originalUnit: unit
    };
  }
  
  // Default to the original unit if no conversion found
  return { 
    standardUnit: unit, 
    conversionFactor: 1,
    originalUnit: unit
  };
}

/**
 * 📅 SMART EXPIRY DATE PREDICTION
 * Predicts expiry dates based on ingredient type and storage conditions
 */
function predictExpiryDate(itemName: string, category: string): { 
  expiryDate: string; 
  storageRecommendation: string; 
  shelfLifeDays: number;
  detailedStorage: {
    temperature: string;
    tips: string;
    storageType: string;
  };
} {
  const today = new Date();
  const nameLower = itemName.toLowerCase();
  
  const expiryMap = EXPIRY_PREDICTIONS as Record<string, any>;
  let prediction = expiryMap[category]?.fresh || { days: 30, storage: 'pantry', temp: 'room temperature', tips: 'Store in cool, dry place' };
  
  // Smart detection based on item characteristics
  if (nameLower.includes('frozen')) {
    prediction = expiryMap[category]?.frozen || { days: 180, storage: 'frozen', temp: '0°F (-18°C)', tips: 'Keep frozen until use' };
  } else if (nameLower.includes('canned') || nameLower.includes('jarred')) {
    prediction = expiryMap[category]?.canned || { days: 365, storage: 'pantry', temp: 'room temperature', tips: 'Store in cool, dry place' };
  } else if (nameLower.includes('dried') || nameLower.includes('powder')) {
    prediction = expiryMap[category]?.dried || { days: 365, storage: 'pantry', temp: 'cool & dry', tips: 'Keep in airtight containers' };
  } else if (nameLower.includes('fresh')) {
    prediction = expiryMap[category]?.fresh || { days: 7, storage: 'refrigerated', temp: '32-40°F (0-4°C)', tips: 'Keep refrigerated' };
  }
  
  // Special cases for specific items with detailed storage info
  if (nameLower.includes('milk')) prediction = EXPIRY_PREDICTIONS.Dairy.milk;
  else if (nameLower.includes('cheese')) prediction = EXPIRY_PREDICTIONS.Dairy.cheese;
  else if (nameLower.includes('yogurt')) prediction = EXPIRY_PREDICTIONS.Dairy.yogurt;
  else if (nameLower.includes('butter')) prediction = EXPIRY_PREDICTIONS.Dairy.butter;
  else if (nameLower.includes('bread')) prediction = EXPIRY_PREDICTIONS['Grains & Cereals'].bread;
  else if (nameLower.includes('berries') || nameLower.includes('strawberry') || nameLower.includes('blueberry')) {
    prediction = EXPIRY_PREDICTIONS['Fresh Fruits'].berries;
  } else if (nameLower.includes('citrus') || nameLower.includes('orange') || nameLower.includes('lemon')) {
    prediction = EXPIRY_PREDICTIONS['Fresh Fruits'].citrus;
  } else if (nameLower.includes('leafy') || nameLower.includes('lettuce') || nameLower.includes('spinach')) {
    prediction = EXPIRY_PREDICTIONS['Fresh Vegetables'].leafy;
  } else if (nameLower.includes('potato') || nameLower.includes('carrot') || nameLower.includes('onion')) {
    prediction = EXPIRY_PREDICTIONS['Fresh Vegetables'].root;
  }
  
  const expiryDate = new Date(today);
  expiryDate.setDate(today.getDate() + prediction.days);
  
  return {
    expiryDate: expiryDate.toISOString().split('T')[0],
    storageRecommendation: prediction.storage,
    shelfLifeDays: prediction.days,
    detailedStorage: {
      temperature: prediction.temp || 'room temperature',
      tips: prediction.tips || 'Store in appropriate conditions',
      storageType: prediction.storage
    }
  };
}

/**
 * 🎯 SMART NUTRITIONAL DATA ENHANCEMENT
 * Adds basic nutritional categories and allergen information
 */
function enhanceWithNutritionalData(itemName: string, category: string): { allergens: string[]; nutritionalCategory: string; isOrganic?: boolean } {
  const nameLower = itemName.toLowerCase();
  const allergens: string[] = [];
  let nutritionalCategory = 'Other';
  let isOrganic = nameLower.includes('organic');
  
  // Allergen detection
  if (nameLower.includes('milk') || nameLower.includes('cheese') || nameLower.includes('butter') || nameLower.includes('cream')) {
    allergens.push('Dairy');
  }
  if (nameLower.includes('egg')) allergens.push('Eggs');
  if (nameLower.includes('wheat') || nameLower.includes('flour') || nameLower.includes('gluten')) allergens.push('Gluten');
  if (nameLower.includes('nut') || nameLower.includes('almond') || nameLower.includes('peanut') || nameLower.includes('cashew')) {
    allergens.push('Nuts');
  }
  if (nameLower.includes('soy') || nameLower.includes('tofu')) allergens.push('Soy');
  if (nameLower.includes('fish') || nameLower.includes('salmon') || nameLower.includes('tuna')) allergens.push('Fish');
  if (nameLower.includes('shellfish') || nameLower.includes('shrimp') || nameLower.includes('crab')) allergens.push('Shellfish');
  if (nameLower.includes('sesame')) allergens.push('Sesame');
  
  // Nutritional category
  switch (category) {
    case 'Proteins': nutritionalCategory = 'High Protein'; break;
    case 'Fruits': 
    case 'Vegetables': nutritionalCategory = 'Vitamins & Minerals'; break;
    case 'Grains': nutritionalCategory = 'Carbohydrates'; break;
    case 'Oils': nutritionalCategory = 'Healthy Fats'; break;
    case 'Dairy': nutritionalCategory = 'Calcium & Protein'; break;
    case 'Spices': nutritionalCategory = 'Antioxidants'; break;
    default: nutritionalCategory = 'General Nutrition';
  }
  
  return { allergens, nutritionalCategory, isOrganic };
}

/**
 * 💡 SMART RECOMMENDATIONS ENGINE
 * Provides intelligent suggestions for inventory management
 */
function generateSmartRecommendations(itemName: string, category: string, quantity: number, unit: string): string[] {
  const recommendations: string[] = [];
  const nameLower = itemName.toLowerCase();
  
  // Storage recommendations
  const expiryData = predictExpiryDate(itemName, category);
  recommendations.push(`Store in ${expiryData.storageRecommendation} conditions`);
  recommendations.push(`Best used within ${expiryData.shelfLifeDays} days`);
  
  // Quantity-based recommendations
  if (quantity < 5 && unit === 'kg') {
    recommendations.push('Consider ordering in bulk for better pricing');
  }
  if (quantity > 100 && (category === 'Vegetables' || category === 'Fruits')) {
    recommendations.push('Monitor closely for spoilage due to large quantity');
  }
  
  // Category-specific recommendations
  switch (category) {
    case 'Dairy':
      recommendations.push('Check temperature regularly (32-40°F)');
      break;
    case 'Proteins':
      if (nameLower.includes('meat') || nameLower.includes('fish')) {
        recommendations.push('Follow FIFO (First In, First Out) rotation');
        recommendations.push('Store at 32°F or below');
      }
      break;
    case 'Vegetables':
      recommendations.push('Check for freshness daily');
      if (nameLower.includes('potato') || nameLower.includes('onion')) {
        recommendations.push('Store in cool, dark, well-ventilated area');
      }
      break;
    case 'Spices':
      recommendations.push('Keep away from light and moisture');
      recommendations.push('Label with purchase date');
      break;
  }
  
  // Special ingredient recommendations
  if (nameLower.includes('oil')) {
    recommendations.push('Store away from heat and light to prevent rancidity');
  }
  if (nameLower.includes('flour') || nameLower.includes('sugar')) {
    recommendations.push('Store in airtight containers to prevent pests');
  }
  
  return recommendations;
}
