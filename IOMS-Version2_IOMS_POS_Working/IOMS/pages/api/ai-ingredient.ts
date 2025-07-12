import { NextApiRequest, NextApiResponse } from 'next';
import { generateIngredientsList } from '../../src/ai/flows/generate-ingredients-list';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { name, aiHint } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Missing dish name' });
  }
  try {
    // Debug logging
    console.log('[AI-INGREDIENT] Request:', { name, aiHint });
    const input = { dishName: name, numberOfServings: 1 };
    const result = await generateIngredientsList(input);
    console.log('[AI-INGREDIENT] Response:', result);
    res.status(200).json({ ingredients: result.ingredients });
  } catch (error: any) {
    console.error('[AI-INGREDIENT] Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate ingredients' });
  }
}
