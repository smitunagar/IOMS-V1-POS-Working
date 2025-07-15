import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  // Get user ID from query parameters
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'default';
  
  // Try user-specific menu first, then fallback to default
  const csvDir = path.resolve(process.cwd(), 'download', 'Copy');
  const userCsvPath = path.join(csvDir, `menu_${userId}.csv`);
  const defaultCsvPath = path.join(csvDir, 'menu.csv');
  
  let csvPath = userCsvPath;
  if (!fs.existsSync(csvPath)) {
    csvPath = defaultCsvPath;
  }
  
  if (!fs.existsSync(csvPath)) {
    return new Response(JSON.stringify({ error: 'Menu CSV not found' }), { status: 404 });
  }
  
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const lines = csv.trim().split('\n');
  const [header, ...rows] = lines;
  const menu = rows.map(row => {
    // Now expect: id,name,quantity,price,category,image,aiHint,ingredients
    const [id, name, quantity, price, category, image, aiHint, ingredients] = row.split(',');
    return {
      id,
      name,
      quantity,
      price: price && price.match(/[0-9]/) ? price : '',
      category,
      image,
      aiHint,
      ingredients: ingredients ? ingredients.split(';') : [],
    };
  });
  return new Response(JSON.stringify({ menu }), { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.menu)) {
      console.error('POST /api/menuCsv: Invalid body', body);
      return new Response(JSON.stringify({ error: 'Invalid menu data' }), { status: 400 });
    }

    // Get user ID from request body or use default
    const userId = body.userId || 'default';
    
    // Create user-specific CSV path
    const csvDir = path.resolve(process.cwd(), 'download', 'Copy');
    const csvPath = path.join(csvDir, `menu_${userId}.csv`);
    
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    console.log('POST /api/menuCsv: Writing to', csvPath);
    
    // Build CSV header and rows (now with quantity)
    const header = 'id,name,quantity,price,category,image,aiHint,ingredients';
    const rows = body.menu.map((item: any, idx: number) => {
      // Ensure all fields are present and escape commas
      const id = item.id ?? idx;
      const name = (item.name ?? '').replace(/,/g, '');
      const quantity = (item.quantity ?? '').replace(/,/g, '');
      const price = (typeof item.price === 'number' || (item.price && item.price.match(/^\d/))) ? item.price : '';
      const category = (item.category ?? '').replace(/,/g, '');
      const image = (item.image ?? '').replace(/,/g, '');
      const aiHint = (item.aiHint ?? '').replace(/,/g, '');
      const ingredients = Array.isArray(item.ingredients) ? item.ingredients.join(';') : '';
      return `${id},${name},${quantity},${price},${category},${image},${aiHint},${ingredients}`;
    });
    const csv = [header, ...rows].join('\n');
    fs.writeFileSync(csvPath, csv, 'utf-8');
    console.log(`POST /api/menuCsv: Successfully wrote ${rows.length} rows to menu_${userId}.csv`);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error('POST /api/menuCsv: Error writing menu.csv', err);
    return new Response(JSON.stringify({ error: 'Failed to write menu.csv', details: err.message }), { status: 500 });
  }
}
