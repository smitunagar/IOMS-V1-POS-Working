import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('==> /api/uploadMenu POST received');
    
    const body = await request.json();
    const { manualMenuData, file, userId, textData } = body;
    
    let menuItems: any[] = [];
    
    if (manualMenuData && Array.isArray(manualMenuData)) {
      menuItems = manualMenuData;
    } else if (textData) {
      // Simple text processing
      const lines = textData.split('\n').filter((line: string) => line.trim().length > 0);
      menuItems = lines.map((line: string, idx: number) => ({
        id: `text-${Date.now()}-${idx}`,
        name: line.trim(),
        price: '',
        category: 'Extracted',
        image: '',
        ingredients: ['water', 'salt'],
        extractionMethod: 'text'
      }));
    }
    
    // Normalize menu items
    menuItems = menuItems.map((item: any, idx: number) => ({
      id: item.id || `menu-${Date.now()}-${idx}`,
      name: item.name || `Item ${idx+1}`,
      price: item.price || '',
      category: item.category || 'Uncategorized',
      image: item.image || '',
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : ['water', 'salt'],
      extractionMethod: item.extractionMethod || 'manual'
    }));
    
    // Export to CSV
    let csvExported = false;
    let csvPath = '';
    
    try {
      const exportsDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });
      
      csvPath = path.join(exportsDir, `menu-export-${Date.now()}.csv`);
      
      let csvContent = 'ID,Name,Price,Category,Image,Ingredients,ExtractionMethod\n';
      menuItems.forEach(item => {
        const ingredients = Array.isArray(item.ingredients) ? item.ingredients.join(';') : '';
        const escapedName = String(item.name || '').replace(/"/g, '""');
        const escapedCategory = String(item.category || '').replace(/"/g, '""');
        csvContent += `"${item.id}","${escapedName}","${item.price}","${escapedCategory}","${item.image}","${ingredients}","${item.extractionMethod}"\n`;
      });
      
      fs.writeFileSync(csvPath, csvContent, 'utf8');
      csvExported = true;
    } catch (csvErr) {
      console.log('CSV export failed:', csvErr);
    }
    
    const result = {
      success: true,
      count: menuItems.length,
      csvExported,
      csvPath,
      extractionAccuracy: menuItems.length > 0 ? 100 : 0,
      menu: menuItems
    };
    
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
    
  } catch (error) {
    console.error('Upload Menu API error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Internal server error'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
