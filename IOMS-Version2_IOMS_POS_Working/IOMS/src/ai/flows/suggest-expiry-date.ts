// Mock implementation for suggestExpiryDate function
// TODO: Replace with actual Gemini API integration when available

// Define the input type for the expiry date suggestion
export interface SuggestExpiryDateInput {
  productName: string;
  productCategory: string;
  productWeight: string;
  manufacturingDate?: string;
}

// Define the output type for the expiry date suggestion
export interface SuggestExpiryDateOutput {
  suggestedExpiryDate: string;
  reason: string;
  confidence: string;
  shelfLifeDays: number;
  storageRecommendation: string;
}

// Mock expiry date prediction based on product category
function getMockExpiryDate(category: string, productName: string): SuggestExpiryDateOutput {
  const today = new Date();
  let expiryDate = new Date();
  let reason = '';
  let confidence = 'Medium';
  let shelfLifeDays = 30;
  let storageRecommendation = 'Store in a cool, dry place';

  // Simple category-based expiry date logic
  const categoryLower = category.toLowerCase();
  const nameLower = productName.toLowerCase();

  if (categoryLower.includes('dairy') || nameLower.includes('milk') || nameLower.includes('cheese') || nameLower.includes('yogurt')) {
    expiryDate.setDate(today.getDate() + 7); // 7 days for dairy
    reason = 'Dairy products typically have a short shelf life and should be consumed within 7 days of opening.';
    confidence = 'High';
    shelfLifeDays = 7;
    storageRecommendation = 'Refrigerate at 2-4°C';
  } else if (categoryLower.includes('meat') || nameLower.includes('chicken') || nameLower.includes('beef') || nameLower.includes('pork')) {
    expiryDate.setDate(today.getDate() + 3); // 3 days for meat
    reason = 'Fresh meat products should be consumed within 3 days for food safety.';
    confidence = 'High';
    shelfLifeDays = 3;
    storageRecommendation = 'Refrigerate at 2-4°C';
  } else if (categoryLower.includes('fish') || nameLower.includes('salmon') || nameLower.includes('tuna')) {
    expiryDate.setDate(today.getDate() + 2); // 2 days for fish
    reason = 'Fresh fish has a very short shelf life and should be consumed within 2 days.';
    confidence = 'High';
    shelfLifeDays = 2;
    storageRecommendation = 'Refrigerate at 2-4°C';
  } else if (categoryLower.includes('bread') || nameLower.includes('bread') || nameLower.includes('bun')) {
    expiryDate.setDate(today.getDate() + 5); // 5 days for bread
    reason = 'Bread products typically last 5-7 days when stored properly.';
    confidence = 'Medium';
    shelfLifeDays = 5;
    storageRecommendation = 'Store in a cool, dry place or refrigerate to extend shelf life';
  } else if (categoryLower.includes('fruit') || nameLower.includes('apple') || nameLower.includes('banana')) {
    expiryDate.setDate(today.getDate() + 7); // 7 days for fruits
    reason = 'Fresh fruits typically last 5-10 days depending on ripeness and storage conditions.';
    confidence = 'Medium';
    shelfLifeDays = 7;
    storageRecommendation = 'Store in refrigerator crisper drawer';
  } else if (categoryLower.includes('vegetable') || nameLower.includes('tomato') || nameLower.includes('lettuce')) {
    expiryDate.setDate(today.getDate() + 7); // 7 days for vegetables
    reason = 'Fresh vegetables typically last 5-10 days when stored properly.';
    confidence = 'Medium';
    shelfLifeDays = 7;
    storageRecommendation = 'Store in refrigerator crisper drawer';
  } else if (categoryLower.includes('beverage') || nameLower.includes('juice') || nameLower.includes('soda')) {
    expiryDate.setDate(today.getDate() + 14); // 14 days for beverages
    reason = 'Beverages typically last 1-2 weeks after opening when refrigerated.';
    confidence = 'Medium';
    shelfLifeDays = 14;
    storageRecommendation = 'Refrigerate after opening';
  } else {
    // Default for unknown categories
    expiryDate.setDate(today.getDate() + 30); // 30 days default
    reason = 'Based on general food safety guidelines, this product should be consumed within 30 days. Please check product packaging for specific instructions.';
    confidence = 'Low';
    shelfLifeDays = 30;
    storageRecommendation = 'Store according to product packaging instructions';
  }

  return {
    suggestedExpiryDate: expiryDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
    reason,
    confidence,
    shelfLifeDays,
    storageRecommendation
  };
}

export async function suggestExpiryDate(input: SuggestExpiryDateInput): Promise<SuggestExpiryDateOutput> {
  try {
    // For now, use the mock implementation
    // TODO: Replace with actual Gemini API call
    const result = getMockExpiryDate(input.productCategory, input.productName);
    
    // Add a small delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return result;
  } catch (error) {
    console.error('Error in suggestExpiryDate:', error);
    
    // Return a fallback response in case of errors
    return {
      suggestedExpiryDate: '',
      reason: 'Unable to predict expiry date due to technical issues. Please consult product packaging or manufacturer guidelines.',
      confidence: 'Low',
      shelfLifeDays: 0,
      storageRecommendation: 'Please consult product packaging or manufacturer guidelines.'
    };
  }
} 