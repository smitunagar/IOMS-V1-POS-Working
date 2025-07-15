import { ai } from '@/ai/genkit';
import { jsonrepair } from 'jsonrepair';

/**
 * Last-ditch recovery for broken, truncated Gemini arrays.
 * Cuts off after last valid object and closes with a bracket.
 */
function recoverLongestValidArray(jsonString: string): string {
  jsonString = jsonString.replace(/,\s*([\]}])/g, '$1');
  let arrStart = jsonString.indexOf('[');
  let lastObjClose = jsonString.lastIndexOf('}');
  if (arrStart === -1 || lastObjClose === -1 || lastObjClose < arrStart) return '[]';
  let cut = jsonString.slice(arrStart, lastObjClose + 1);
  if (!cut.trim().endsWith(']')) cut += "\n]\n";
  return cut;
}

/**
 * Extracts menu data from a PDF using Gemini and robust post-processing.
 */
export async function extractMenuFromPdf({ pdfDataUri }: { pdfDataUri: string }) {
  const prompt = `
You are an expert at reading restaurant menu PDFs. Extract every dish, drink, or menu item as a JSON object.

IMPORTANT: Pay special attention to menu sections and categories. Look for:
- Section headers (e.g., "PIZZA", "BEVERAGES", "APPETIZERS", "MAIN COURSES")
- Category titles (e.g., "Italian Specialties", "Local Favorites", "Chef's Recommendations")
- Grouped items under common headers

For each menu item, extract:
- "name": Dish or beverage name, exactly as printed.
- "price": The full price string for the item, including all sizes if shown, e.g. "(0,3l) 3,50 € (0,5l) 4,50 €". If no price, use an empty string.
- "category": The section/category name where this item appears. Look for:
  * Section headers above the item (e.g., "PIZZA", "BEVERAGES", "SALADS")
  * Category titles (e.g., "Italian Specialties", "Local Favorites")
  * If an item appears under multiple categories, use the most specific one
  * If no clear category is shown, infer from the item type (e.g., "Pizza" for pizza items, "Beverages" for drinks)
  * Never use "Other" unless absolutely no context is available
- "ingredients": Array of ingredient names if shown in menu. If not listed, use [].

**Return only a single valid JSON array of objects.** No explanations, no markdown, no text before or after the array.

Example output:
[
  {"name":"Zwiefalter Helles Vollbier","price":"(0,3l) 3,50 € (0,5l) 4,50 €","category":"Beverages","ingredients":[]},
  {"name":"Chicken Tikka Grill","price":"18,00 €","category":"Main Courses","ingredients":["Hühnerbruststücke"]},
  {"name":"Margherita Pizza","price":"12,50 €","category":"Pizza","ingredients":["Tomato sauce", "Mozzarella", "Basil"]},
  {"name":"Caesar Salad","price":"8,50 €","category":"Salads","ingredients":["Lettuce", "Parmesan", "Croutons"]}
]
`;

  // Call Gemini via Genkit
  const result = await ai.generate([
    { text: prompt },
    { media: { url: pdfDataUri } }
  ]);
  console.log('GENKIT RAW RESULT:', result);

  // Extract text, from code block or raw
  let text = typeof result.text === 'string' ? result.text : '';
  let cleanText = '';
  const jsonMatch = text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
  if (jsonMatch) {
    cleanText = jsonMatch[1].trim();
  } else {
    cleanText = text.trim();
  }

  // Remove trailing code fences and comments, just in case
  cleanText = cleanText
    .replace(/```/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .trim();

  // DEBUG: See what we are trying to parse
  console.log('CLEAN JSON TO PARSE:', cleanText);

  let items: any[] = [];
  try {
    // 1. Try straight parse
    items = JSON.parse(cleanText);
  } catch (e) {
    // 2. Try jsonrepair
    try {
      items = JSON.parse(jsonrepair(cleanText));
    } catch (e2) {
      // 3. Try best-effort recovery for truncation
      try {
        const partial = recoverLongestValidArray(cleanText);
        items = JSON.parse(partial);
      } catch (e3) {
        // 4. Give up, show nothing
        items = [];
      }
    }
  }

  // Only filter for valid name field
  const filtered = Array.isArray(items) ? items.filter(
    (item) => item && typeof item.name === 'string' && item.name.length > 0
  ) : [];

  // Post-process categories to improve consistency
  console.log('🔍 Processing categories for items:', filtered.length);
  const processed = filtered.map(item => {
    let category = item.category || '';
    
    // Clean up category names
    category = category.trim();
    
    // Normalize common category variations
    const categoryMap: Record<string, string> = {
      'bier': 'Beverages',
      'biere': 'Beverages',
      'getränke': 'Beverages',
      'drinks': 'Beverages',
      'beverages': 'Beverages',
      'pizza': 'Pizza',
      'pizzas': 'Pizza',
      'salat': 'Salads',
      'salate': 'Salads',
      'salads': 'Salads',
      'vorspeise': 'Appetizers',
      'appetizer': 'Appetizers',
      'appetizers': 'Appetizers',
      'hauptgericht': 'Main Courses',
      'main course': 'Main Courses',
      'main courses': 'Main Courses',
      'dessert': 'Desserts',
      'desserts': 'Desserts',
      'nachspeise': 'Desserts',
      'other': 'Other',
      '': 'Other'
    };
    
    // Check for exact matches first
    const normalizedCategory = categoryMap[category.toLowerCase()];
    if (normalizedCategory) {
      category = normalizedCategory;
    } else {
      // Check for partial matches
      const lowerCategory = category.toLowerCase();
      for (const [key, value] of Object.entries(categoryMap)) {
        if (lowerCategory.includes(key) || key.includes(lowerCategory)) {
          category = value;
          break;
        }
      }
    }
    
    // If still no good category, try to infer from the item name
    if (category === 'Other' || !category) {
      const name = item.name.toLowerCase();
      if (name.includes('pizza') || name.includes('pasta')) {
        category = 'Main Courses';
      } else if (name.includes('salad') || name.includes('salat')) {
        category = 'Salads';
      } else if (name.includes('beer') || name.includes('bier') || name.includes('wine') || name.includes('cola') || name.includes('soda')) {
        category = 'Beverages';
      } else if (name.includes('cake') || name.includes('ice cream') || name.includes('dessert')) {
        category = 'Desserts';
      } else if (name.includes('soup') || name.includes('appetizer') || name.includes('starter')) {
        category = 'Appetizers';
      } else {
        category = 'Main Courses'; // Default assumption
      }
    }
    
    console.log(`📝 Item: "${item.name}" | Original Category: "${item.category}" | Processed Category: "${category}"`);
    
    return {
      ...item,
      category: category
    };
  });

  console.log('✅ Final processed items with categories:', processed.length);
  return processed;

}
