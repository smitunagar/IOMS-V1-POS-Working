export const runtime = "nodejs";
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractMenuFromPdf } from '@/lib/aiMenuExtractor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { file } = body;
    if (!file) return new Response(JSON.stringify({ message: 'Missing PDF file data' }), { status: 400 });

    const pdfDataUri = `data:application/pdf;base64,${file}`;
    
    let menuResult: any;
    try {
      menuResult = await extractMenuFromPdf({ pdfDataUri });
    } catch (aiError) {
      console.error('AI extraction failed:', aiError);
      // Return a helpful error message
      return new Response(JSON.stringify({ 
        message: 'AI menu extraction failed. Please check your API key configuration.',
        error: aiError instanceof Error ? aiError.message : 'Unknown AI error',
        suggestion: 'Please ensure you have a valid Gemini API key in your .env.local file'
      }), { status: 400 });
    }

    // Helper to escape CSV fields
    function escapeCsvField(field: string) {
      if (typeof field !== 'string') field = String(field ?? '');
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return '"' + field.replace(/"/g, '""') + '"';
      }
      return field;
    }
    
    // Ensure all menu items have required fields for CSV
    const menuItems: any[] = (Array.isArray(menuResult) ? menuResult : (menuResult && menuResult.items ? menuResult.items : []))
      .filter((item: any) => item && typeof item.name === 'string' && item.name.length > 0)
      .map((item: any, idx: number) => ({
        id: item.id || (idx + 1).toString(),
        name: item.name || '',
        price: item.price || '',
        category: item.category || '',
        image: item.image || '',
        aiHint: item.aiHint || '',
        ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
      }));
    
    console.log('FINAL MENU ITEMS TO WRITE:', menuItems);
    console.log('📊 Category breakdown:', menuItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
    
    // Save to menu.csv with proper escaping - match the expected CSV structure
    const csvHeader = 'id,name,quantity,price,category,image,aiHint,ingredients';
    const csvRows = menuItems.map((item: any) => [
      escapeCsvField(item.id),
      escapeCsvField(item.name),
      escapeCsvField(item.quantity || ''), // Add quantity field
      escapeCsvField(item.price),
      escapeCsvField(item.category),
      escapeCsvField(item.image),
      escapeCsvField(item.aiHint),
      escapeCsvField(item.ingredients.join(';'))
    ].join(','));
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Always resolve to /tmp for Vercel compatibility
    const csvDir = '/tmp';
    const csvPath = path.join(csvDir, 'menu.csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    fs.writeFileSync(csvPath, csvContent, 'utf-8');

    // Detect partial or repaired extraction
    const partialOrRepaired = menuResult && menuResult.partialOrRepaired;
    
    // After writing menu.csv, trigger import to localStorage for the current user if userId is provided
    // (Assume userId is sent in the request body for automation)
    if (body.userId) {
      return new Response(JSON.stringify({ 
        success: true, 
        count: menuItems.length, 
        shouldImport: true, 
        partialOrRepaired, 
        menu: menuItems 
      }), { status: 200 });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      count: menuItems.length, 
      partialOrRepaired, 
      menu: menuItems 
    }), { status: 200 });
    
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return new Response(JSON.stringify({ 
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
}
