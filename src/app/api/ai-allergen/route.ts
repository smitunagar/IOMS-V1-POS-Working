import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

async function generateAllergenList(input: { dishName: string; aiHint?: string }) {
  const { dishName, aiHint } = input;
  const prompt = `You are a food safety expert. For the dish: "${dishName}", list the most likely food allergens present. Use compact emojis/icons for each allergen (e.g., 🥛 for milk, 🥜 for peanuts, 🌾 for gluten, 🥚 for egg, 🐟 for fish, 🦐 for shellfish, 🌰 for tree nuts, 🍑 for soy, 🍯 for sesame, 🌶️ for spicy, 🍋 for citrus, etc). For each allergen, return an object with 'icon' and 'name' (the full allergen name in English or the menu language). ${aiHint ? `Context: ${aiHint}` : ''}
Return ONLY a valid JSON array of objects: [{"icon": "emoji", "name": "allergen name"}, ...]. No explanations, no markdown, just the JSON array.`;
  try {
    const result = await ai.generate([{ text: prompt }]);
    let text = typeof result.text === 'string' ? result.text : '';
    let cleanText = text.trim();
    const jsonMatch = text.match(/```json([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/);
    if (jsonMatch) {
      cleanText = jsonMatch[1].trim();
    }
    cleanText = cleanText.replace(/```/g, '').trim();
    const allergens = JSON.parse(cleanText);
    if (!Array.isArray(allergens)) throw new Error('Invalid response format');
    return { allergens };
  } catch (error) {
    console.error('AI allergen generation failed:', error);
    // Fallback: common allergens
    const fallbackAllergens = [
      { icon: '🌾', name: 'Gluten' },
      { icon: '🥛', name: 'Milk' },
      { icon: '🥚', name: 'Egg' },
      { icon: '🥜', name: 'Peanut' },
      { icon: '🌰', name: 'Tree nut' },
      { icon: '🍑', name: 'Soy' },
      { icon: '🍯', name: 'Sesame' },
      { icon: '🐟', name: 'Fish' },
      { icon: '🦐', name: 'Shellfish' },
      { icon: '🌶️', name: 'Spicy' }
    ];
    return { allergens: fallbackAllergens };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, aiHint } = body;
    if (!name) {
      return NextResponse.json({ error: 'Missing dish name' }, { status: 400 });
    }
    const result = await generateAllergenList({ dishName: name, aiHint });
    return NextResponse.json({ allergens: result.allergens });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to generate allergens' }, { status: 500 });
  }
} 