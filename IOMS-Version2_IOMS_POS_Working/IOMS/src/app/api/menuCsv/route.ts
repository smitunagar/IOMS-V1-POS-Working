import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Function to clean menu item names by removing price information
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

export async function GET(req: NextRequest) {
  const csvPath = path.join(process.cwd(), 'download', 'Copy', 'menu.csv');
  if (!fs.existsSync(csvPath)) {
    return new Response(JSON.stringify({ error: 'Menu CSV not found' }), { status: 404 });
  }
  const csv = fs.readFileSync(csvPath, 'utf-8');
  const lines = csv.trim().split('\n');
  const [header, ...rows] = lines;
  
  const menu = rows.map(row => {
    // Parse CSV row with proper handling of quoted fields
    const columns = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < row.length) {
      const char = row[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        // Check for escaped quotes ("")
        if (i + 1 < row.length && row[i + 1] === '"') {
          currentField += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        columns.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
      i++;
    }
    columns.push(currentField); // Add the last field
    
    const [id, name, quantity, price, category, image, aiHint, ingredients] = columns;
    
    // Parse ingredients from CSV format
    let parsedIngredients = [];
    if (ingredients && ingredients.trim()) {
      try {
        // If ingredients looks like JSON, parse it
        if (ingredients.startsWith('[') && ingredients.endsWith(']')) {
          parsedIngredients = JSON.parse(ingredients.replace(/""/g, '"')); // Unescape quotes
        } else {
          // Otherwise, split by semicolon and create basic ingredient objects
          parsedIngredients = ingredients.split(';').filter(Boolean).map(ingredientName => ({
            inventoryItemName: ingredientName.trim(),
            quantityPerDish: 1,
            unit: 'pcs'
          }));
        }
      } catch (e) {
        console.warn('Failed to parse ingredients:', ingredients, e);
        parsedIngredients = [];
      }
    }
    
    return {
      id,
      name: cleanMenuItemName(name), // Clean the name to remove price information
      quantity,
      price: price && price.match(/[0-9]/) ? price : '',
      category,
      image,
      aiHint,
      ingredients: parsedIngredients,
    };
  });
  return new Response(JSON.stringify({ menu }), { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const csvPath = path.join(process.cwd(), 'download', 'Copy', 'menu.csv');
    console.log('POST /api/menuCsv: Writing to', csvPath); // DEBUG: log the absolute path
    const body = await req.json();
    if (!body || !Array.isArray(body.menu)) {
      console.error('POST /api/menuCsv: Invalid body', body);
      return new Response(JSON.stringify({ error: 'Invalid menu data' }), { status: 400 });
    }
    
    // Build CSV header and rows (now with quantity)
    const header = 'id,name,quantity,price,category,image,aiHint,ingredients';
    const rows = body.menu.map((item: any, idx: number) => {
      // Ensure all fields are present and escape commas
      const id = item.id ?? idx;
      const name = cleanMenuItemName((item.name ?? '').replace(/,/g, '')); // Clean and escape commas
      const quantity = (item.quantity ?? '').replace(/,/g, '');
      const price = (typeof item.price === 'number' || (item.price && item.price.match(/^\d/))) ? item.price : '';
      const category = (item.category ?? '').replace(/,/g, '');
      const image = (item.image ?? '').replace(/,/g, '');
      const aiHint = (item.aiHint ?? '').replace(/,/g, '');
      
      // Properly serialize ingredients
      let ingredientsStr = '';
      if (Array.isArray(item.ingredients) && item.ingredients.length > 0) {
        // Check if ingredients are objects with inventoryItemName, quantityPerDish, unit
        if (item.ingredients[0] && typeof item.ingredients[0] === 'object' && 'inventoryItemName' in item.ingredients[0]) {
          // Serialize as JSON string (escape quotes)
          ingredientsStr = JSON.stringify(item.ingredients).replace(/"/g, '""');
        } else {
          // Simple string array, join with semicolons
          ingredientsStr = item.ingredients.join(';');
        }
      }
      
      return `${id},${name},${quantity},${price},${category},${image},${aiHint},"${ingredientsStr}"`;
    });
    
    const csv = [header, ...rows].join('\n');
    fs.writeFileSync(csvPath, csv, 'utf-8');
    console.log(`POST /api/menuCsv: Successfully wrote ${rows.length} rows to menu.csv`);
    console.log('Sample ingredients serialization:', body.menu[0]?.ingredients); // Debug log
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error('POST /api/menuCsv: Error writing menu.csv', err);
    return new Response(JSON.stringify({ error: 'Failed to write menu.csv', details: err.message }), { status: 500 });
  }
}
