import { NextRequest, NextResponse } from 'next/server';
import { advancedGeminiParser } from '../../../../lib/advancedGeminiParser';
import { dbHelpers } from '../../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    
    console.log('🔄 Processing menu file with advanced Gemini AI parser...');
    
    // Check if Gemini AI is available
    if (!advancedGeminiParser.isAvailable()) {
      console.log('⚠️ Gemini AI not available, using fallback categorization');
      
      // Use fallback processing
      const fallbackData = await processWithFallback(fileContent);
      return NextResponse.json(fallbackData);
    }

    // Process with advanced Gemini AI
    const parsedData = await advancedGeminiParser.processMenuFile(fileContent);
    
    console.log(`✅ AI Processing completed in ${parsedData.processingTime}ms`);
    console.log(`📊 Found ${parsedData.totalItems} items in ${parsedData.categories.length} categories`);

    // Clear existing menu items
    await clearExistingMenuItems();

    // Insert new menu items into database
    const insertedItems = await insertMenuItemsToDatabase(parsedData.items);

    // Get category breakdown
    const categoryBreakdown = getCategoryBreakdown(parsedData.items);

    const response = {
      success: true,
      message: 'Menu uploaded successfully with advanced AI categorization',
      data: {
        totalItems: parsedData.totalItems,
        categories: parsedData.categories,
        categoryBreakdown,
        processingTime: parsedData.processingTime,
        insertedItems: insertedItems.length,
        sampleItems: parsedData.items.slice(0, 5).map(item => ({
          name: item.name,
          category: item.category,
          price: item.price,
          ingredients: item.ingredients,
          aiHint: item.aiHint
        }))
      }
    };

    console.log('🎉 Advanced menu upload completed successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in advanced menu upload:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to process menu file',
        details: errorMessage,
        fallback: 'Try using the standard menu upload instead'
      },
      { status: 500 }
    );
  }
}

/**
 * Process menu with fallback categorization
 */
async function processWithFallback(fileContent: string) {
  console.log('🔄 Using fallback categorization...');
  
  // Parse CSV manually
  const lines = fileContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const items = lines.slice(1).map((line, index) => {
    const values = line.split(',').map(v => v.trim());
    const item: any = {
      id: (index + 1).toString()
    };
    
    headers.forEach((header, i) => {
      item[header.toLowerCase()] = values[i] || '';
    });
    
    return item;
  });

  // Use smart fallback categorization
  const categorizedItems = items.map((item: any) => {
    const category = smartFallbackCategorization(item.name || '', item.price || '');
    return {
      ...item,
      category,
      ingredients: extractIngredients(item.name || ''),
      aiHint: 'Fallback categorization used'
    };
  });

  // Clear existing menu items
  await clearExistingMenuItems();

  // Insert items
  const insertedItems = await insertMenuItemsToDatabase(categorizedItems);

  const categories = [...new Set(categorizedItems.map(item => item.category))];
  const categoryBreakdown = getCategoryBreakdown(categorizedItems);

  return {
    success: true,
    message: 'Menu uploaded with fallback categorization (Gemini AI not available)',
    data: {
      totalItems: categorizedItems.length,
      categories,
      categoryBreakdown,
      processingTime: 0,
      insertedItems: insertedItems.length,
      sampleItems: categorizedItems.slice(0, 5).map(item => ({
        name: item.name,
        category: item.category,
        price: item.price,
        ingredients: item.ingredients,
        aiHint: item.aiHint
      }))
    }
  };
}

/**
 * Smart fallback categorization
 */
function smartFallbackCategorization(name: string, price: string): string {
  const lowerName = name.toLowerCase();
  const lowerPrice = price.toLowerCase();

  // Cocktails
  if (lowerName.includes('moscow mule') || lowerName.includes('zombie') || 
      lowerName.includes('long island') || lowerName.includes('swimming pool')) {
    return 'Cocktails';
  }

  // Mocktails
  if (lowerName.includes('virgin') || lowerName.includes('mojito') || 
      lowerName.includes('kiss') || lowerName.includes('punch')) {
    return 'Mocktails';
  }

  // Spirits
  if (lowerName.includes('vodka') || lowerName.includes('gin') || 
      lowerName.includes('rum') || lowerName.includes('whisky')) {
    return 'Spirits';
  }

  // Liqueurs
  if (lowerName.includes('likör') || lowerName.includes('schnaps') || 
      lowerName.includes('grappa') || lowerName.includes('jägermeister')) {
    return 'Liqueurs';
  }

  // German Wines
  if (lowerName.includes('jechtinger') || lowerName.includes('stettener') || 
      lowerName.includes('haberschl') || lowerName.includes('munzinger')) {
    return 'German Wines';
  }

  // International Wines
  if (lowerName.includes('cellier') || lowerName.includes('castelnuovo') || 
      lowerName.includes('zonin') || lowerName.includes('merlot')) {
    return 'International Wines';
  }

  // Non-Alcoholic Wine/Sekt
  if (lowerName.includes('alkoholfrei') || lowerName.includes('weinschorle')) {
    return 'Non-Alcoholic Wine/Sekt';
  }

  // Chicken Dishes
  if (lowerName.includes('chicken') || lowerName.includes('huhn')) {
    return 'Chicken Dishes';
  }

  // Lamb Dishes
  if (lowerName.includes('lamm') || lowerName.includes('lamb')) {
    return 'Lamb Dishes';
  }

  // Fish Dishes
  if (lowerName.includes('fish') || lowerName.includes('fisch')) {
    return 'Fish Dishes';
  }

  // Vegetarian Dishes
  if (lowerName.includes('gemüse') || lowerName.includes('dal') || 
      lowerName.includes('vegetarian')) {
    return 'Vegetarian Dishes';
  }

  // Soft Drinks
  if (lowerName.includes('limonade') || lowerName.includes('soda') || 
      lowerName.includes('cola')) {
    return 'Soft Drinks';
  }

  // Default categories
  if (lowerPrice.includes('€') && parseFloat(lowerPrice.replace(/[^\d,]/g, '').replace(',', '.')) < 5) {
    return 'Beverages';
  }

  return 'Main Courses';
}

/**
 * Extract ingredients from item name
 */
function extractIngredients(name: string): string[] {
  const ingredients: string[] = [];
  const lowerName = name.toLowerCase();

  const ingredientPatterns = [
    'vodka', 'gin', 'rum', 'tequila', 'whisky', 'limette', 'limettensaft',
    'ginger', 'gurke', 'orange', 'ananas', 'grenadine', 'kokos', 'sahne',
    'mango', 'himbeere', 'kirsch', 'mandeln', 'kartoffeln', 'zwiebeln',
    'ingwer', 'knoblauch', 'tomaten', 'spinat', 'champignons', 'erbsen',
    'linsen', 'kräutern', 'gewürzen', 'rohrzucker', 'minze', 'maracuja',
    'grapefruit', 'wassermelone', 'erdbeer', 'birne', 'wein', 'sekt'
  ];

  ingredientPatterns.forEach(ingredient => {
    if (lowerName.includes(ingredient)) {
      ingredients.push(ingredient.charAt(0).toUpperCase() + ingredient.slice(1));
    }
  });

  return ingredients;
}

/**
 * Clear existing menu items
 */
async function clearExistingMenuItems() {
  try {
    const { default: db } = await import('../../../../lib/database');
    db.prepare('DELETE FROM menu_items').run();
    console.log('🗑️ Cleared existing menu items');
  } catch (error) {
    console.error('Error clearing menu items:', error);
  }
}

/**
 * Insert menu items to database
 */
async function insertMenuItemsToDatabase(items: any[]) {
  try {
    const { default: db, dbHelpers } = await import('../../../../lib/database');
    const categories = dbHelpers.getCategories();
    
    const insertedItems = [];
    
    for (const item of items) {
      // Find category ID
      const category = categories.find((c: any) => c.name === item.category);
      const categoryId = category ? (category as any).id : 1; // Default to first category
      
      // Clean price
      const cleanPrice = cleanPriceFormat(item.price || '');
      
      // Insert menu item
      const result = db.prepare(`
        INSERT INTO menu_items (name, price, category_id, image, ai_hint, ingredients)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        item.name || '',
        cleanPrice,
        categoryId,
        item.image || '',
        item.aiHint || '',
        JSON.stringify(item.ingredients || [])
      );
      
      insertedItems.push({
        id: result.lastInsertRowid,
        name: item.name,
        category: item.category,
        price: cleanPrice
      });
    }
    
    console.log(`✅ Inserted ${insertedItems.length} menu items`);
    return insertedItems;
    
  } catch (error) {
    console.error('Error inserting menu items:', error);
    throw error;
  }
}

/**
 * Clean price formatting
 */
function cleanPriceFormat(price: string): string {
  const priceMatch = price.match(/(\d+[,\d]*)\s*€/);
  if (priceMatch) {
    return `${priceMatch[1].replace(',', '.')} €`;
  }
  return price;
}

/**
 * Get category breakdown
 */
function getCategoryBreakdown(items: any[]) {
  const breakdown: { [key: string]: number } = {};
  
  items.forEach(item => {
    const category = item.category || 'Main Courses';
    breakdown[category] = (breakdown[category] || 0) + 1;
  });
  
  return breakdown;
} 