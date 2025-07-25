import fs from 'fs';
import path from 'path';
import { Dish } from './menuService';

// Server-side menu service that reads from CSV files
export function getServerSideDishes(userId: string | null): Dish[] {
  try {
    console.log('[Server Menu Service] Getting dishes for user:', userId);
    
    // Try to read the CSV file
    const csvPath = path.join(process.cwd(), 'download', 'Copy', 'menu.csv');
    console.log('[Server Menu Service] Looking for CSV at:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.log('[Server Menu Service] CSV file not found, using fallback data');
      return getFallbackMenuData();
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      console.log('[Server Menu Service] CSV file empty or invalid, using fallback data');
      return getFallbackMenuData();
    }
    
    // Parse CSV (skip header)
    const dishes: Dish[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = parseCsvLine(line);
      if (columns.length >= 6) {
        const [id, name, priceStr, category, image, aiHint, ingredients] = columns;
        
        // Clean price string (remove "EUR" and extra text)
        let price = 0;
        const priceMatch = priceStr.match(/(\d+\.?\d*)/);
        if (priceMatch) {
          price = parseFloat(priceMatch[1]);
        }
        
        dishes.push({
          id: id || `dish_${i}`,
          name: name || 'Unknown Dish',
          price,
          category: category || 'Other',
          image: image || '',
          aiHint: aiHint || '',
          ingredients: ingredients ? ingredients.split(';') : []
        });
      }
    }
    
    console.log('[Server Menu Service] Loaded', dishes.length, 'dishes from CSV');
    console.log('[Server Menu Service] Sample dishes:', dishes.slice(0, 3).map(d => d.name));
    
    return dishes;
    
  } catch (error) {
    console.error('[Server Menu Service] Error reading CSV:', error);
    return getFallbackMenuData();
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function getFallbackMenuData(): Dish[] {
  console.log('[Server Menu Service] Using fallback menu data');
  
  return [
    {
      id: 'dish_1',
      name: 'VEGETABLE SAMOSA',
      price: 5.50,
      category: 'Starters',
      image: '',
      aiHint: 'Crispy vegetable samosa',
      ingredients: ['Vegetables', 'Pastry', 'Spices']
    },
    {
      id: 'dish_2',
      name: 'BEEF SAMOSA',
      price: 6.50,
      category: 'Starters',
      image: '',
      aiHint: 'Crispy beef samosa',
      ingredients: ['Beef', 'Pastry', 'Spices']
    },
    {
      id: 'dish_3',
      name: 'Chicken Biryani',
      price: 12.90,
      category: 'Main Dishes',
      image: '',
      aiHint: 'Aromatic chicken biryani',
      ingredients: ['Chicken', 'Basmati Rice', 'Spices']
    },
    {
      id: 'dish_4',
      name: 'Samosa Chaat',
      price: 6.50,
      category: 'Starters',
      image: '',
      aiHint: 'Samosa with chaat masala',
      ingredients: ['Samosa', 'Onions', 'Tomatoes', 'Chaat Masala']
    },
    {
      id: 'dish_5',
      name: 'Cheesy Samosa Bake',
      price: 7.00,
      category: 'Starters',
      image: '',
      aiHint: 'Baked samosa with cheese',
      ingredients: ['Samosa', 'Cheese', 'Herbs']
    }
  ];
}
