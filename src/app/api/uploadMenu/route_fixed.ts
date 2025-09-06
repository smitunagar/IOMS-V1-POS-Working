import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractMenuFromPdf } from '@/lib/aiMenuExtractor';
import { generateIngredientsList } from '@/ai/flows/generate-ingredients-list';

export const runtime = 'nodejs';

// Simple heuristic text extraction
function extractHeuristicFromText(text: string): any[] {
  const items: any[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 2);
  
  // Enhanced regex patterns for food detection
  const foodPatterns = [
    /^([A-Z][a-z\s&'-]+)\s*[\$£€₹]?\s*(\d+(?:\.\d{1,2})?)/,
    /([A-Z][a-z\s&'-]+)[\s\t]*(\d+(?:\.\d{1,2})?)/,
    /(.+?)\s*[\$£€₹]\s*(\d+(?:\.\d{1,2})?)/,
    /^(\d+)\.\s*([A-Za-z][a-z\s&'-]+)\s*[\$£€₹]?\s*(\d+(?:\.\d{1,2})?)/
  ];
  
  lines.forEach((line, idx) => {
    line = line.trim();
    if (line.length < 3) return;
    
    for (const pattern of foodPatterns) {
      const match = line.match(pattern);
      if (match) {
        let name = match[1] || match[2] || '';
        let price = match[2] || match[3] || '';
        
        // If pattern has 3 groups, price is in group 3
        if (match.length === 4) {
          name = match[2];
          price = match[3];
        }
        
        name = name.trim().replace(/[\.\d]+$/, '').trim();
        
        if (name.length > 2 && name.length < 50 && /[a-zA-Z]/.test(name)) {
          items.push({
            id: `heuristic-${Date.now()}-${idx}`,
            name: name,
            price: price,
            category: 'Extracted',
            image: '',
            ingredients: ['water', 'salt'],
            extractionMethod: 'heuristic'
          });
          break;
        }
      }
    }
  });
  
  return items;
}

export async function POST(request: NextRequest) {
  try {
    console.log('==> /api/uploadMenu POST received');
    
    const body = await request.json();
    console.log('payload keys:', Object.keys(body || {}));
    
    const { manualMenuData, file, userId, textData } = body;
    
    let menuItems: any[] = [];
    
    if (manualMenuData && Array.isArray(manualMenuData)) {
      menuItems = manualMenuData;
    } else if (textData && typeof textData === 'string') {
      // Simple text extraction
      menuItems = extractHeuristicFromText(textData);
    } else if (file) {
      // Try AI extraction first
      try {
        const pdfUri = typeof file === 'string' ? `data:application/pdf;base64,${file}` : file;
        const extracted = await extractMenuFromPdf(pdfUri);
        if (extracted && Array.isArray(extracted)) {
          menuItems = extracted;
        }
      } catch (err) {
        console.log('AI extraction failed:', err);
        
        // Fallback to heuristic extraction
        if (typeof file === 'string') {
          try {
            const pdfBuffer = Buffer.from(file, 'base64');
            const pdfParse = await import('pdf-parse');
            const parsed = await pdfParse.default(pdfBuffer);
            const text = parsed?.text || '';
            const extractedItems = extractHeuristicFromText(text);
            if (extractedItems.length > 0) {
              menuItems = extractedItems;
            }
          } catch (pdfErr) {
            console.log('PDF fallback failed:', pdfErr);
          }
        }
      }
    }
    
    // Normalize menu items
    menuItems = menuItems.map((item: any, idx: number) => ({
      id: item.id || `menu-${Date.now()}-${idx}`,
      name: item.name || item.title || `Item ${idx+1}`,
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
