import { GoogleGenerativeAI } from '@google/generative-ai';

// Environment variables
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gemini-1.5-flash';
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '4096');
const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || '0.3');

// Initialize Gemini AI
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export interface MenuItem {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  aiHint: string;
  ingredients: string[];
}

export interface ParsedMenuData {
  items: MenuItem[];
  categories: string[];
  totalItems: number;
  processingTime: number;
}

export class AdvancedGeminiParser {
  private genAI: GoogleGenerativeAI | null;
  private model: any;

  constructor() {
    this.genAI = genAI;
    this.model = this.genAI ? this.genAI.getGenerativeModel({
      model: AI_MODEL,
      generationConfig: {
        maxOutputTokens: AI_MAX_TOKENS,
        temperature: AI_TEMPERATURE,
      },
    }) : null;
  }

  /**
   * Check if Gemini AI is available
   */
  isAvailable(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  /**
   * Advanced menu categorization using Gemini AI
   */
  async categorizeMenuItems(menuData: any[]): Promise<ParsedMenuData> {
    if (!this.isAvailable()) {
      throw new Error('Gemini AI is not available. Please set GOOGLE_GENERATIVE_AI_API_KEY in .env.local');
    }

    const startTime = Date.now();
    
    try {
      // Prepare menu data for AI processing
      const menuText = this.prepareMenuText(menuData);
      
      // Create detailed prompt for categorization
      const prompt = this.createCategorizationPrompt(menuText);
      
      // Get AI response
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response
      const parsedData = this.parseAIResponse(text, menuData);
      
      const processingTime = Date.now() - startTime;
      
      return {
        items: parsedData.items,
        categories: parsedData.categories,
        totalItems: parsedData.items.length,
        processingTime
      };
      
    } catch (error) {
      console.error('Error in advanced menu categorization:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`AI categorization failed: ${errorMessage}`);
    }
  }

  /**
   * Prepare menu text for AI processing
   */
  private prepareMenuText(menuData: any[]): string {
    return menuData.map((item, index) => {
      return `${index + 1}. ${item.name} - ${item.price}`;
    }).join('\n');
  }

  /**
   * Create detailed prompt for menu categorization
   */
  private createCategorizationPrompt(menuText: string): string {
    return `You are an expert restaurant menu analyzer with expertise in German and international cuisine. Analyze the following menu items and categorize them into specific restaurant categories.

AVAILABLE CATEGORIES:
1. Cocktails - Mixed alcoholic drinks (Moscow Mule, Zombie, Long Island Ice Tea, etc.)
2. Mocktails - Non-alcoholic cocktails (Virgin Caipirinha, Watermelon Mojito, etc.)
3. Spirits - Pure alcoholic drinks (Vodka, Gin, Rum, etc.)
4. Liqueurs - Sweet alcoholic beverages (Mangolikör, Kokosnuss-Schnaps, etc.)
5. German Wines - German wine varieties (Jechtinger, Stettener, etc.)
6. International Wines - Italian, French, and other international wines
7. Wines - General wine category
8. Non-Alcoholic Wine/Sekt - Non-alcoholic wine and sparkling drinks
9. Soft Drinks - Cola, lemonade, and carbonated drinks
10. Fresh Juices - Fresh fruit and vegetable juices
11. Hot Beverages - Tea, coffee, and hot drinks
12. Chicken Dishes - Chicken curry and chicken-based dishes
13. Lamb Dishes - Lamb curry and lamb-based dishes
14. Fish Dishes - Fish curry and fish-based dishes
15. Vegetarian Dishes - Vegetable curry and vegetarian dishes
16. Rice Dishes - Basmati rice and rice-based dishes
17. Breads - Naan, roti, and Indian breads
18. Appetizers - Starter dishes
19. Salads - Salad items
20. Side Dishes - Rice, bread, and side accompaniments
21. Desserts - Sweet dessert items
22. Sweets and Snacks - Candies, cookies, and snack items
23. Spices - Cooking spices and seasonings
24. Pre Mix - Pre-mixed food products

GERMAN LANGUAGE RECOGNITION:
- "Alkoholfreie Getränke" = Non-Alcoholic Wine/Sekt or Soft Drinks
- "Alkoholische Getränke" = Spirits, Cocktails, or Wines
- "Cocktails" = Cocktails
- "Weine" = Wines
- "Spirituosen" = Spirits
- "Liköre" = Liqueurs
- "Erfrischungsgetränke" = Soft Drinks
- "Säfte" = Fresh Juices
- "Heiße Getränke" = Hot Beverages
- "Hauptgerichte" = Main Courses
- "Vorspeisen" = Appetizers
- "Nachspeisen" = Desserts
- "Beilagen" = Side Dishes

MENU ITEMS TO CATEGORIZE:
${menuText}

INSTRUCTIONS:
1. Analyze each menu item carefully, including German language items
2. Consider the item name, ingredients, price, and category headers
3. Assign the most specific category possible based on German and English terms
4. Extract ingredients from item names where possible
5. Clean up price formatting (remove volume info, keep only price)
6. Provide detailed reasoning for categorization
7. Pay special attention to German category headers like "Alkoholfreie Getränke"
8. If items are under "Alkoholfreie Getränke", categorize them as Soft Drinks or Non-Alcoholic Wine/Sekt
9. If items are under "Alkoholische Getränke", categorize them as Spirits, Cocktails, or Wines

RESPONSE FORMAT:
Return a JSON object with the following structure:
{
  "items": [
    {
      "id": "original_id",
      "name": "cleaned_name",
      "price": "cleaned_price",
      "category": "specific_category",
      "ingredients": ["ingredient1", "ingredient2"],
      "aiHint": "reasoning_for_categorization"
    }
  ],
  "categories": ["category1", "category2", "category3"],
  "summary": {
    "totalItems": number,
    "categoryBreakdown": {"category": count},
    "processingNotes": "any_important_notes"
  }
}

Please analyze the menu items and provide the categorization in the exact JSON format specified.`;
  }

  /**
   * Parse AI response and extract structured data
   */
  private parseAIResponse(aiResponse: string, originalData: any[]): { items: MenuItem[], categories: string[] } {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Transform AI response to MenuItem format
      const items: MenuItem[] = parsed.items.map((item: any, index: number) => ({
        id: item.id || originalData[index]?.id || (index + 1).toString(),
        name: item.name || originalData[index]?.name || '',
        price: item.price || originalData[index]?.price || '',
        category: item.category || 'Main Courses',
        image: originalData[index]?.image || '',
        aiHint: item.aiHint || '',
        ingredients: item.ingredients || []
      }));

      const categories = parsed.categories || [...new Set(items.map(item => item.category))];

      return { items, categories };
      
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.log('AI Response:', aiResponse);
      
      // Fallback to original data with basic categorization
      return this.fallbackCategorization(originalData);
    }
  }

  /**
   * Fallback categorization when AI fails
   */
  private fallbackCategorization(originalData: any[]): { items: MenuItem[], categories: string[] } {
    console.log('Using fallback categorization');
    
    const items: MenuItem[] = originalData.map((item, index) => {
      const category = this.smartFallbackCategorization(item.name, item.price, item.category);
      return {
        id: item.id || (index + 1).toString(),
        name: item.name || '',
        price: this.cleanPrice(item.price || ''),
        category,
        image: item.image || '',
        aiHint: 'Fallback categorization used',
        ingredients: this.extractIngredients(item.name || '')
      };
    });

    const categories = [...new Set(items.map(item => item.category))];
    
    return { items, categories };
  }

  /**
   * Smart fallback categorization using pattern matching
   */
  private smartFallbackCategorization(name: string, price: string, category?: string): string {
    const lowerName = name.toLowerCase();
    const lowerPrice = price.toLowerCase();
    const lowerCategory = category?.toLowerCase() || '';

    // German Category Header Recognition (Priority 1)
    if (lowerCategory.includes('alkoholfreie getränke') || lowerCategory.includes('alkoholfrei')) {
      return 'Non-Alcoholic Wine/Sekt';
    }

    if (lowerCategory.includes('alkoholische getränke') || lowerCategory.includes('alkoholisch')) {
      return 'Spirits';
    }

    if (lowerCategory.includes('erfrischungsgetränke') || lowerCategory.includes('erfrischung')) {
      return 'Soft Drinks';
    }

    if (lowerCategory.includes('säfte') || lowerCategory.includes('saft')) {
      return 'Fresh Juices';
    }

    if (lowerCategory.includes('heiße getränke') || lowerCategory.includes('heiß')) {
      return 'Hot Beverages';
    }

    if (lowerCategory.includes('hauptgerichte') || lowerCategory.includes('hauptgericht')) {
      return 'Main Courses';
    }

    if (lowerCategory.includes('vorspeisen') || lowerCategory.includes('vorspeise')) {
      return 'Appetizers';
    }

    if (lowerCategory.includes('nachspeisen') || lowerCategory.includes('nachspeise')) {
      return 'Desserts';
    }

    if (lowerCategory.includes('beilagen') || lowerCategory.includes('beilage')) {
      return 'Side Dishes';
    }

    // German Language Recognition in Item Name (Priority 2)
    if (lowerName.includes('alkoholfreie getränke') || lowerName.includes('alkoholfrei')) {
      return 'Non-Alcoholic Wine/Sekt';
    }

    if (lowerName.includes('alkoholische getränke') || lowerName.includes('alkoholisch')) {
      return 'Spirits';
    }

    if (lowerName.includes('erfrischungsgetränke') || lowerName.includes('erfrischung')) {
      return 'Soft Drinks';
    }

    if (lowerName.includes('säfte') || lowerName.includes('saft')) {
      return 'Fresh Juices';
    }

    if (lowerName.includes('heiße getränke') || lowerName.includes('heiß')) {
      return 'Hot Beverages';
    }

    if (lowerName.includes('hauptgerichte') || lowerName.includes('hauptgericht')) {
      return 'Main Courses';
    }

    if (lowerName.includes('vorspeisen') || lowerName.includes('vorspeise')) {
      return 'Appetizers';
    }

    if (lowerName.includes('nachspeisen') || lowerName.includes('nachspeise')) {
      return 'Desserts';
    }

    if (lowerName.includes('beilagen') || lowerName.includes('beilage')) {
      return 'Side Dishes';
    }

    // Specific German Beverage Recognition (Priority 3)
    if (lowerName.includes('wasser') || lowerName.includes('water')) {
      return 'Soft Drinks';
    }

    if (lowerName.includes('coca-cola') || lowerName.includes('cola') || 
        lowerName.includes('fanta') || lowerName.includes('sprite') || 
        lowerName.includes('spezi') || lowerName.includes('bitter lemon')) {
      return 'Soft Drinks';
    }

    if (lowerName.includes('eistee') || lowerName.includes('iced tea')) {
      return 'Soft Drinks';
    }

    // Cocktails
    if (lowerName.includes('moscow mule') || lowerName.includes('zombie') || 
        lowerName.includes('long island') || lowerName.includes('swimming pool')) {
      return 'Cocktails';
    }

    // Mocktails
    if (lowerName.includes('virgin') || lowerName.includes('mojito') || 
        lowerName.includes('kiss') || lowerName.includes('punch')) {
      return 'Mocktails';
    }

    // Spirits
    if (lowerName.includes('vodka') || lowerName.includes('gin') || 
        lowerName.includes('rum') || lowerName.includes('whisky') ||
        lowerName.includes('wodka')) {
      return 'Spirits';
    }

    // Liqueurs
    if (lowerName.includes('likör') || lowerName.includes('schnaps') || 
        lowerName.includes('grappa') || lowerName.includes('jägermeister')) {
      return 'Liqueurs';
    }

    // German Wines
    if (lowerName.includes('jechtinger') || lowerName.includes('stettener') || 
        lowerName.includes('haberschl') || lowerName.includes('munzinger')) {
      return 'German Wines';
    }

    // International Wines
    if (lowerName.includes('cellier') || lowerName.includes('castelnuovo') || 
        lowerName.includes('zonin') || lowerName.includes('merlot')) {
      return 'International Wines';
    }

    // Non-Alcoholic Wine/Sekt
    if (lowerName.includes('alkoholfrei') || lowerName.includes('weinschorle')) {
      return 'Non-Alcoholic Wine/Sekt';
    }

    // Chicken Dishes
    if (lowerName.includes('chicken') || lowerName.includes('huhn')) {
      return 'Chicken Dishes';
    }

    // Lamb Dishes
    if (lowerName.includes('lamm') || lowerName.includes('lamb')) {
      return 'Lamb Dishes';
    }

    // Fish Dishes
    if (lowerName.includes('fish') || lowerName.includes('fisch')) {
      return 'Fish Dishes';
    }

    // Vegetarian Dishes
    if (lowerName.includes('gemüse') || lowerName.includes('dal') || 
        lowerName.includes('vegetarian')) {
      return 'Vegetarian Dishes';
    }

    // Soft Drinks
    if (lowerName.includes('limonade') || lowerName.includes('soda') || 
        lowerName.includes('cola')) {
      return 'Soft Drinks';
    }

    // Default categories
    if (lowerPrice.includes('€') && parseFloat(lowerPrice.replace(/[^\d,]/g, '').replace(',', '.')) < 5) {
      return 'Soft Drinks';
    }

    return 'Main Courses';
  }

  /**
   * Clean price formatting
   */
  private cleanPrice(price: string): string {
    // Remove volume information and keep only price
    const priceMatch = price.match(/(\d+[,\d]*)\s*€/);
    if (priceMatch) {
      return `${priceMatch[1].replace(',', '.')} €`;
    }
    return price;
  }

  /**
   * Extract ingredients from item name
   */
  private extractIngredients(name: string): string[] {
    const ingredients: string[] = [];
    const lowerName = name.toLowerCase();

    // Common ingredients to look for (English and German)
    const ingredientPatterns = [
      // Alcoholic beverages
      'vodka', 'gin', 'rum', 'tequila', 'whisky', 'wodka',
      'limette', 'limettensaft', 'lime', 'lime juice',
      'ginger', 'gurke', 'cucumber', 'orange', 'ananas', 'pineapple',
      'grenadine', 'kokos', 'coconut', 'sahne', 'cream',
      'mango', 'himbeere', 'raspberry', 'kirsch', 'cherry',
      'mandeln', 'almonds', 'kartoffeln', 'potatoes', 'zwiebeln', 'onions',
      'ingwer', 'ginger', 'knoblauch', 'garlic', 'tomaten', 'tomatoes',
      'spinat', 'spinach', 'champignons', 'mushrooms', 'erbsen', 'peas',
      'linsen', 'lentils', 'kräutern', 'herbs', 'gewürzen', 'spices',
      'rohrzucker', 'sugar', 'minze', 'mint', 'maracuja', 'passion fruit',
      'grapefruit', 'wassermelone', 'watermelon', 'erdbeer', 'strawberry',
      'birne', 'pear', 'wein', 'wine', 'sekt', 'sparkling wine',
      
      // German specific ingredients
      'pfirsich', 'peach', 'zitrone', 'lemon', 'sprudel', 'sparkling',
      'still', 'still water', 'bitter lemon', 'eistee', 'iced tea',
      'spezi', 'cola', 'fanta', 'sprite', 'wasser', 'water'
    ];

    ingredientPatterns.forEach(ingredient => {
      if (lowerName.includes(ingredient)) {
        // Capitalize first letter
        const capitalized = ingredient.charAt(0).toUpperCase() + ingredient.slice(1);
        if (!ingredients.includes(capitalized)) {
          ingredients.push(capitalized);
        }
      }
    });

    return ingredients;
  }

  /**
   * Process menu file with advanced categorization
   */
  async processMenuFile(fileContent: string): Promise<ParsedMenuData> {
    try {
      // Parse CSV content
      const menuData = this.parseCSV(fileContent);
      
      // Use advanced categorization
      return await this.categorizeMenuItems(menuData);
      
    } catch (error) {
      console.error('Error processing menu file:', error);
      throw error;
    }
  }

  /**
   * Parse CSV content
   */
  private parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      const item: any = {
        id: (index + 1).toString()
      };
      
      headers.forEach((header, i) => {
        item[header.toLowerCase()] = values[i] || '';
      });
      
      return item;
    });
  }
}

// Export singleton instance
export const advancedGeminiParser = new AdvancedGeminiParser(); 