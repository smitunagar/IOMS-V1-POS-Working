import { ai } from '@/ai/genkit';
import { jsonrepair } from 'jsonrepair';
import { getInventory } from './inventoryService';
import { getDishes } from './menuService';
import { generateIngredientsList } from '@/ai/flows/generate-ingredients-list';

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
 * Helper for batching with concurrency limit
 */
async function batchWithConcurrencyLimit<T, R>(items: T[], fn: (item: T) => Promise<R>, limit: number): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  const executing: Promise<void>[] = [];
  async function run(item: T, i: number) {
    results[i] = await fn(item);
  }
  while (idx < items.length) {
    const i = idx;
    const p = run(items[i], i);
    executing.push(p);
    idx++;
    if (executing.length >= limit) {
      await Promise.race(executing);
      // Remove finished
      for (let j = executing.length - 1; j >= 0; j--) {
        if (typeof executing[j]?.then === 'function') {
          executing.splice(j, 1);
        }
      }
    }
  }
  await Promise.all(executing);
  return results;
}

/**
 * Extracts menu data from a PDF using Gemini and robust post-processing.
 */
export async function extractMenuFromPdf({ pdfDataUri, userId, numberOfServings = 1 }: { pdfDataUri: string, userId?: string, numberOfServings?: number }) {
  const prompt = `
You are an expert at reading restaurant menu PDFs in any language (e.g., German, English, French, etc.). Extract every dish, drink, or menu item as a JSON object.

For each menu item, extract:
- "name": Dish or beverage name, exactly as printed, but **never include the price or currency in the name**. The name must NOT contain any price or currency. Only the actual name, in the original language.
- "price": The price string for the item (e.g., "3,20 €", "2.50 EUR", "$4.00"). If no price, use an empty string.
- "category": Section/category name (e.g., "Pizza", "Biere", "Salate", "Getränke (Drinks)"). If not shown, use "Other". Always preserve the original language.
- "ingredients": Array of ingredient names if shown in menu. If not listed, use [].

**If a menu item has multiple variants (e.g., sizes or volumes with different prices), group all variants under a single menu item object. Add a 'sizes' array: each entry should have 'size' (exactly as shown in the menu, e.g., '0.3 l') and 'price'. Do not convert, round, or change the size string.**

**Return only a single valid JSON array of objects.** No explanations, no markdown, no text before or after the array.

Example output:
[
  {"name":"Coca-Cola","category":"Soft Drinks","sizes":[{"size":"0.3 l","price":"2,00 €"},{"size":"0.5 l","price":"3,00 €"},{"size":"1.0 l","price":"5,00 €"}],"ingredients":[]},
  {"name":"Zwiefalter-Engele, helles Bier","price":"3,20 €","category":"Biere","ingredients":[], "size": "0,33l"},
  {"name":"Zwiefalter-Urweizen Dunkel","price":"4,20 €","category":"Biere","ingredients":[], "size": "0,5l"},
  {"name":"Water Bottle","price":"2,00 €","category":"Getränke (Drinks)","ingredients":[], "size": "0,3l"},
  {"name":"Water Bottle","price":"3,00 €","category":"Getränke (Drinks)","ingredients":[], "size": "0,5l"},
  {"name":"Chicken Curry","price":"10,00 €","category":"Spezialitäten vom Huhn mit Reis","ingredients":[]},
  {"name":"Chicken Korma","price":"10,00 €","category":"Spezialitäten vom Huhn mit Reis","ingredients":["Mandeln", "Sahne", "Kokosnuss", "feinen Gewürzen"]},
  {"name":"Glas Prosecco 15% vol","price":"5,90 €","category":"Aperitifs","ingredients":[], "size": "0,2l"},
  {"name":"Indischer Weißwein","price":"6,90 €","category":"Indische Weine","ingredients":[], "size": "0,2l"},
  {"name":"Indischer Weißwein","price":"21,00 €","category":"Indische Weine","ingredients":[], "size": "0,75l"}
]

// BAD EXAMPLE (do NOT do this!):
// {"name": "Water Bottle (0,3l) 2,00 € (0,5l) 3,00 €", "price": "", ...}
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

  // Post-process: If a single item contains multiple variants in price or name, split them into separate items
  const variantRegex = /([0-9]+[\.,][0-9]+\s*(l|cl|ml|g|kg|L|CL|ML|G|KG)?)[^\d]*(\d+[\.,]\d+\s*(€|EUR|USD|GBP|\$))/gi;
  let expanded: any[] = [];
  for (const item of items) {
    if (item && typeof item.price === 'string' && variantRegex.test(item.price)) {
      // e.g. price: "(0,3l) 2,00 € (0,5l) 3,00 €"
      const matches = [...item.price.matchAll(variantRegex)];
      if (matches.length > 1) {
        for (const match of matches) {
          expanded.push({
            ...item,
            price: match[3].trim(),
            size: match[1].trim(),
          });
        }
        continue;
      }
    }
    expanded.push(item);
  }

  // Post-process: If price is missing but name contains a price, extract it
  const priceRegex = /[-–—]\s*(\d+[\.,]\d+)\s*(EUR|USD|GBP|€|\$)?/i;
  const processed = Array.isArray(expanded) ? expanded.map((item) => {
    if (item && typeof item.name === 'string' && (!item.price || item.price === '')) {
      const match = item.name.match(priceRegex);
      if (match) {
        const priceStr = match[1] + (match[2] ? ' ' + match[2] : '');
        return {
          ...item,
          price: priceStr.trim(),
          name: item.name.replace(priceRegex, '').trim().replace(/[-–—]\s*$/, '').trim(),
        };
      }
    }
    return item;
  }) : [];

  // Only filter for valid name field
  const filtered = Array.isArray(processed) ? processed.filter(
    (item) => item && typeof item.name === 'string' && item.name.length > 0
  ) : [];

  // Merge items with same name/category into a single object with sizes array
  const mergedMap = new Map();
  for (const item of filtered) {
    const key = `${item.name}||${item.category}`;
    if (!mergedMap.has(key)) {
      // Start new entry
      mergedMap.set(key, {
        ...item,
        sizes: item.size || item.sizes ? [] : undefined,
      });
    }
    const merged = mergedMap.get(key);
    // If item has size/price, add to sizes array
    if (item.size || (item.price && item.price !== '')) {
      if (!merged.sizes) merged.sizes = [];
      merged.sizes.push({
        size: item.size || (item.sizes && item.sizes[0]?.size) || '',
        price: item.price || (item.sizes && item.sizes[0]?.price) || '',
      });
    }
  }
  // Finalize merged list
  const merged = Array.from(mergedMap.values()).map(item => {
    if (item.sizes && item.sizes.length === 1 && (!item.sizes[0].size || item.sizes[0].size.trim() === '')) {
      // Only one size and it's empty: move price to top-level
      return { ...item, price: item.sizes[0].price, sizes: undefined };
    } else if (item.sizes && item.sizes.length > 0) {
      // Remove top-level price/size if multiple sizes
      const { price, size, ...rest } = item;
      return { ...rest, sizes: item.sizes };
    } else {
      // Single size or no sizes
      return item;
    }
  });

  // After merging and before returning, ensure every item has a unique id
  const mergedWithIds = merged.map(item => {
    if (item.id && typeof item.id === 'string' && item.id.length > 0) return item;
    // Generate a unique id from name, category, price, and size (if present)
    let id = `${item.name}__${item.category}`;
    if (item.price) id += `__${item.price}`;
    if (item.size) id += `__${item.size}`;
    if (item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0) {
      id += '__' + item.sizes.map((sz: { size: string; price: string }) => `${sz.size}_${sz.price}`).join('__');
    }
    return { ...item, id };
  });

  // Ingredient enrichment logic
  let inventory: any[] = [];
  let menuDishes: any[] = [];
  if (userId) {
    try { inventory = getInventory(userId); } catch {}
    try { menuDishes = getDishes(userId); } catch {}
  }

  // Helper to find ingredient with quantity in inventory or menu
  function findIngredientWithQuantity(ingredientName: string): { name: string, quantity: number, unit: string } | null {
    // Check inventory
    if (inventory && Array.isArray(inventory)) {
      const inv = inventory.find(i => i.name.toLowerCase() === ingredientName.toLowerCase());
      if (inv && inv.quantity && inv.unit) {
        return { name: inv.name, quantity: inv.quantity, unit: inv.unit };
      }
    }
    // Check menu
    if (menuDishes && Array.isArray(menuDishes)) {
      for (const dish of menuDishes) {
        if (dish.ingredients && Array.isArray(dish.ingredients)) {
          for (const ing of dish.ingredients) {
            if (typeof ing === 'object' && ing.inventoryItemName && ing.inventoryItemName.toLowerCase() === ingredientName.toLowerCase()) {
              return { name: ing.inventoryItemName, quantity: ing.quantityPerDish, unit: ing.unit };
            }
          }
        }
      }
    }
    return null;
  }

  // Collect all AI ingredient generation tasks
  const aiTasks: { idx: number, name: string, missing: string[] }[] = [];
  for (let i = 0; i < mergedWithIds.length; i++) {
    const item = mergedWithIds[i];
    if (item.ingredients && Array.isArray(item.ingredients) && item.ingredients.length > 0) {
      const missing: string[] = [];
      for (const ing of item.ingredients) {
        let found = findIngredientWithQuantity(ing);
        if (!found) missing.push(ing);
      }
      if (missing.length > 0) {
        aiTasks.push({ idx: i, name: item.name, missing });
      }
    } else if (item.name) {
      aiTasks.push({ idx: i, name: item.name, missing: [] });
    }
  }

  // Batch AI calls for ingredient generation (concurrency limit 5)
  const aiResults = await batchWithConcurrencyLimit(aiTasks, async (task) => {
    try {
      return await generateIngredientsList({ dishName: task.name, numberOfServings });
    } catch {
      return { ingredients: [] };
    }
  }, 5);

  // Map AI results back to menu items
  for (let i = 0; i < aiTasks.length; i++) {
    const { idx, missing } = aiTasks[i];
    const aiResult = aiResults[i];
    if (!mergedWithIds[idx].ingredients || mergedWithIds[idx].ingredients.length === 0) {
      // No ingredients, use full AI list
      // Normalize to { inventoryItemName, quantityPerDish, unit }
      mergedWithIds[idx].ingredients = aiResult.ingredients.map((ing: any) => ({
        inventoryItemName: ing.name,
        quantityPerDish: ing.quantity,
        unit: ing.unit
      }));
    } else {
      // If original ingredients are just names (strings), and AI returns objects, use AI's list directly
      if (
        Array.isArray(mergedWithIds[idx].ingredients) &&
        mergedWithIds[idx].ingredients.every((ing: any) => typeof ing === 'string') &&
        Array.isArray(aiResult.ingredients) &&
        aiResult.ingredients.length > 0 &&
        aiResult.ingredients.every((aii: any) => typeof aii === 'object' && 'name' in aii && 'quantity' in aii && 'unit' in aii)
      ) {
        mergedWithIds[idx].ingredients = aiResult.ingredients;
      } else {
        // Only fill in missing ingredients
        const enriched: any[] = [];
        for (const ing of mergedWithIds[idx].ingredients) {
          let found = findIngredientWithQuantity(ing);
          if (found) {
            enriched.push(found);
          } else {
            // Find in AI result
            const aiIng = aiResult.ingredients.find(aii => aii.name.toLowerCase() === (typeof ing === 'string' ? ing.toLowerCase() : ''));
            if (aiIng) {
              enriched.push(aiIng);
            } else {
              enriched.push({ name: typeof ing === 'string' ? ing : '', quantity: 0, unit: '' });
            }
          }
        }
        // Normalize to { inventoryItemName, quantityPerDish, unit }
        mergedWithIds[idx].ingredients = enriched.map((ing: any) => ({
          inventoryItemName: ing.name,
          quantityPerDish: ing.quantity,
          unit: ing.unit
        }));
      }
    }
  }

  return mergedWithIds;
}

// Alias for compatibility with API handler
export async function extractMenuItemsFromPdfWithGemini(buffer: Buffer): Promise<any[]> {
  // Convert buffer to data URI
  const pdfDataUri = `data:application/pdf;base64,${buffer.toString('base64')}`;
  const items = await extractMenuFromPdf({ pdfDataUri });
  return items;
} 