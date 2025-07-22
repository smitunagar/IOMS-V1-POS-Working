export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractMenuFromPdf } from '@/lib/aiMenuExtractor';
import { PrismaClient } from '@prisma/client';
import formidable, { File as FormidableFile, Fields, Files } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

async function parseForm(req: any): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false });
    form.parse(req, (err: any, fields: Fields, files: Files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export async function POST(req: Request) {
  try {
    // Parse multipart/form-data
    const { fields, files } = await parseForm(req);
    const file = files.file as FormidableFile | FormidableFile[] | undefined;
    if (!file || (Array.isArray(file) && !file[0])) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }
    // Support both single and array file
    const fileObj = Array.isArray(file) ? file[0] : file;
    const pdfBuffer = fs.readFileSync(fileObj.filepath);
    const pdfDataUri = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

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
    
    // --- DB INSERTION LOGIC ---
    // Optionally clear old menu items (uncomment if needed)
    // await prisma.menuItem.deleteMany();

    for (const item of menuItems) {
      // Upsert MenuItem
      const menuItem = await prisma.menuItem.create({
        data: {
          name: item.name,
          price: parseFloat(item.price) || 0,
          category: item.category,
          image: item.image && typeof item.image === 'object' ? item.image : (item.image ? { url: item.image } : {}),
          aiHint: item.aiHint || '',
        },
      });
      // Handle ingredients
      if (Array.isArray(item.ingredients)) {
        for (const ingName of item.ingredients) {
          if (!ingName) continue;
          // Find or create ingredient
          let ingredient = await prisma.ingredient.findFirst({ where: { name: ingName } });
          if (!ingredient) {
            ingredient = await prisma.ingredient.create({ data: { name: ingName } });
          }
          // Create MenuItemIngredient link (quantity is optional, default 1)
          await prisma.menuItemIngredient.create({
            data: {
              menuItemId: menuItem.id,
              ingredientId: ingredient.id,
              quantity: 1,
            },
          });
        }
      }
    }
    // --- END DB INSERTION LOGIC ---

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
    // If you need userId or other fields, extract from 'fields' object
    // Example: const userId = fields.userId as string | undefined;

    return new Response(JSON.stringify({ 
      success: true, 
      count: menuItems.length, 
      partialOrRepaired, 
      menu: menuItems 
    }), { status: 200 });
    
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    return new Response(JSON.stringify({ 
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
}
