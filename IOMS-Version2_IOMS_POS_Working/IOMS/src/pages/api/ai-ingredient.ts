// /api/ai-ingredient endpoint for AI ingredient generation
// Uses AI logic to generate ingredient list based on dish name

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateIngredientsList } from '@/ai/flows/generate-ingredients-list';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { name } = req.body;
      console.log('[AI INGREDIENT TOOL] Request body:', req.body);
      // Call the real AI Ingredient Tool logic
      const aiResult = await generateIngredientsList({ dishName: name, numberOfServings: 1 });
      console.log('[AI INGREDIENT TOOL] AI result:', aiResult);
      // Defensive: support both { ingredients: [...] } and []
      if (Array.isArray(aiResult.ingredients)) {
        return res.status(200).json({ ingredients: aiResult.ingredients });
      } else if (Array.isArray(aiResult)) {
        return res.status(200).json({ ingredients: aiResult });
      } else {
        return res.status(200).json({ ingredients: [] });
      }
    } catch (e: any) {
      console.error('[AI INGREDIENT TOOL] Error:', e);
      return res.status(500).json({ error: e.message || 'Failed to generate ingredients.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
