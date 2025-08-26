// AI Ingredient Tool Service
// This service communicates with the AI Ingredient Tool API to fetch ingredients for a given dish

// Accepts a dish object with name and aiHint
export async function getIngredientsForDish(dish: { name: string, aiHint?: string }): Promise<any[]> {
  // Call the AI Ingredient Tool API
  const response = await fetch('/api/ai-ingredient', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: dish.name, aiHint: dish.aiHint }),
  });
  // Parse the JSON data
  const data = await response.json();
  console.log('AI Ingredient Tool response:', data); // Debug log
  // Try to handle different possible response structures
  if (Array.isArray(data.ingredients)) return data.ingredients;
  if (Array.isArray(data)) return data;
  if (data.result && Array.isArray(data.result.ingredients)) return data.result.ingredients;
  return [];
}

// AI Allergen Tool Service
// This service communicates with the AI Allergen Tool API to fetch allergens for a given dish
export async function getAllergensForDish(dish: { name: string, aiHint?: string }): Promise<Array<{icon: string, name: string}>> {
  const response = await fetch('/api/ai-allergen', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: dish.name, aiHint: dish.aiHint }),
  });
  const data = await response.json();
  if (Array.isArray(data.allergens)) return data.allergens;
  if (Array.isArray(data)) return data;
  if (data.result && Array.isArray(data.result.allergens)) return data.result.allergens;
  return [];
} 