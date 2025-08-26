import { NextRequest, NextResponse } from 'next/server';
import ImprovedDataExtractor from '../../../lib/improvedDataExtractor';
import db, { dbHelpers } from '../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const extractor = new ImprovedDataExtractor();

    console.log('🔄 Processing menu with improved AI extraction...');

    // Extract menu items using AI
    const extractedItems = await ImprovedDataExtractor.extractMenuItemsFromText(text);

    console.log(`📊 AI extracted ${extractedItems.length} menu items`);

    let successCount = 0;
    let errorCount = 0;
    const results: any[] = [];

    for (const item of extractedItems) {
      try {
        // Get or create category
        const categoryId = dbHelpers.upsertCategory(item.category);
        
        // Insert menu item
        const result = dbHelpers.insertMenuItem({
          name: item.name,
          description: item.description,
          price: item.price,
          category_id: categoryId,
          ingredients: item.ingredients.join(';'),
          preparation_time: item.preparation_time,
          is_vegetarian: item.is_vegetarian,
          is_vegan: item.is_vegan,
          is_gluten_free: item.is_gluten_free
        });

        if (result.changes > 0) {
          successCount++;
          results.push({
            name: item.name,
            category: item.category,
            price: item.price,
            ingredients: item.ingredients,
            status: 'success'
          });
        }
      } catch (error) {
        console.error(`❌ Error inserting menu item ${item.name}:`, error);
        errorCount++;
        results.push({
          name: item.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Get category breakdown
    const categories = dbHelpers.getCategories();
    const categoryBreakdown: { [key: string]: number } = {};
    
    categories.forEach((cat: any) => {
      const result = db.prepare('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?').get(cat.id) as { count: number };
      const count = typeof result.count === 'number' ? result.count : 0;
      categoryBreakdown[cat.name] = count;
    });

    console.log(`✅ Menu upload completed: ${successCount} successful, ${errorCount} errors`);
    console.log('📊 Category breakdown:', categoryBreakdown);

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${successCount} menu items`,
      data: {
        totalProcessed: extractedItems.length,
        successCount,
        errorCount,
        results,
        categoryBreakdown
      }
    });

  } catch (error) {
    console.error('❌ Error in improved menu upload:', error);
    return NextResponse.json(
      { error: 'Failed to process menu file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get all menu items with categories
    const menuItems = dbHelpers.getMenuItems();
    const categories = dbHelpers.getCategories();

    // Get category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    categories.forEach((cat: any) => {
      const result = db.prepare('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?').get(cat.id) as { count: number };
      const count = typeof result.count === 'number' ? result.count : 0;
      categoryBreakdown[cat.name] = count;
    });

    return NextResponse.json({
      success: true,
      data: {
        menuItems,
        categories,
        categoryBreakdown,
        totalItems: menuItems.length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching menu data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu data' },
      { status: 500 }
    );
  }
} 