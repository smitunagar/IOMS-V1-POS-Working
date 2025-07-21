import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Proper CSV parsing function that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  return result;
}

export async function GET(req: NextRequest) {
  let csvPath = '/tmp/menu.csv';
  if (!fs.existsSync(csvPath)) {
    // Fallback to menu_default.csv if menu.csv does not exist
    const fallbackPath = '/tmp/menu_default.csv';
    if (fs.existsSync(fallbackPath)) {
      csvPath = fallbackPath;
    } else {
      return new Response(JSON.stringify({ error: 'Menu CSV not found' }), { status: 404 });
    }
  }
  
  try {
    const csv = fs.readFileSync(csvPath, 'utf-8');
    const lines = csv.trim().split('\n');
    const [header, ...rows] = lines;
    
    const menu = rows.map((row, index) => {
      try {
        // Use proper CSV parsing
        const fields = parseCSVLine(row);
        const [id, name, quantity, price, category, image, aiHint, ingredients] = fields;
        
        return {
          id: id || (index + 1).toString(),
          name: name || '',
          quantity: quantity || '',
          price: price || '',
          category: category || '',
          image: image || '',
          aiHint: aiHint || '',
          ingredients: ingredients ? ingredients.split(';').filter(Boolean) : [],
        };
      } catch (error) {
        console.error(`Error parsing row ${index}:`, row, error);
        return {
          id: (index + 1).toString(),
          name: 'Error parsing item',
          quantity: '',
          price: '',
          category: '',
          image: '',
          aiHint: '',
          ingredients: [],
        };
      }
    });
    
    return new Response(JSON.stringify({ menu }), { status: 200 });
  } catch (error) {
    console.error('Error reading CSV:', error);
    return new Response(JSON.stringify({ error: 'Failed to read menu CSV' }), { status: 500 });
  }
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
    
    // Create user-specific CSV path in /tmp
    const csvDir = '/tmp';
    const csvPath = path.join(csvDir, `menu_${userId}.csv`);
    
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    console.log('POST /api/menuCsv: Writing to', csvPath);
    
    // Build CSV header and rows with proper escaping
    const header = 'id,name,quantity,price,category,image,aiHint,ingredients';
    const rows = body.menu.map((item: any, idx: number) => {
      // Properly escape fields for CSV
      const escapeField = (field: any) => {
        if (field === null || field === undefined) return '';
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      const id = escapeField(item.id ?? idx);
      const name = escapeField(item.name ?? '');
      const quantity = escapeField(item.quantity ?? '');
      const price = escapeField(item.price ?? '');
      const category = escapeField(item.category ?? '');
      const image = escapeField(item.image ?? '');
      const aiHint = escapeField(item.aiHint ?? '');
      const ingredients = escapeField(Array.isArray(item.ingredients) ? item.ingredients.join(';') : '');
      
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
