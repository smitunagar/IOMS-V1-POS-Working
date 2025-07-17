"use client";

import React, { useState } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Check, X } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { debugDishInventoryAlignment, getDishes } from '@/lib/menuService';
import { getInventory, addInventoryItem } from '@/lib/inventoryService';
import { validateDishAvailability } from '@/lib/posInventoryIntegration';
import { checkDishServingAvailability, getMenuServingCapacity } from '@/lib/servingAvailabilityService';
import { useToast } from "@/hooks/use-toast";

// Enhanced ingredient matching with multi-language support
interface IngredientMatch {
  original: string;
  found?: any;
  suggestions: any[];
  score: number;
  isExact: boolean;
  isTranslation: boolean;
  translatedFrom?: string;
}

interface MissingIngredient {
  name: string;
  suggestedName: string;
  category: string;
  unit: string;
  quantity: number;
}

// Multi-language ingredient mappings
const INGREDIENT_TRANSLATIONS = {
  // English to German/other languages
  'chicken': ['hähnchen', 'huhn', 'geflügel', 'chicken breast', 'hühnerbrust'],
  'beef': ['rindfleisch', 'rind', 'beef'],
  'pork': ['schweinefleisch', 'schwein', 'pork'],
  'rice': ['reis', 'basmati', 'jasmin reis', 'basmati rice'],
  'cheese': ['käse', 'mozzarella', 'parmesan', 'gouda'],
  'tomato': ['tomate', 'tomaten', 'cherry tomaten'],
  'onion': ['zwiebel', 'zwiebeln', 'red onion', 'weiße zwiebel'],
  'garlic': ['knoblauch', 'garlic cloves'],
  'pepper': ['pfeffer', 'paprika', 'bell pepper'],
  'salt': ['salz', 'sea salt', 'table salt'],
  'oil': ['öl', 'olive oil', 'vegetable oil', 'cooking oil'],
  'butter': ['butter', 'margarine'],
  'milk': ['milch', 'vollmilch', 'low fat milk'],
  'egg': ['ei', 'eier', 'eggs'],
  'flour': ['mehl', 'wheat flour', 'all purpose flour'],
  'sugar': ['zucker', 'brown sugar', 'white sugar'],
  'herbs': ['kräuter', 'herbs', 'fresh herbs', 'dried herbs'],
  'spices': ['gewürze', 'spices', 'mixed spices']
};

// Common units mapping
const UNIT_MAPPINGS = {
  'kg': ['kilogram', 'kilo', 'kilos'],
  'g': ['gram', 'grams', 'gramm'],
  'l': ['liter', 'litre', 'litres'],
  'ml': ['milliliter', 'millilitre'],
  'pcs': ['pieces', 'piece', 'stück', 'stücke'],
  'tbsp': ['tablespoon', 'tablespoons', 'esslöffel'],
  'tsp': ['teaspoon', 'teaspoons', 'teelöffel']
};

export default function DebugPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [missingIngredients, setMissingIngredients] = useState<MissingIngredient[]>([]);
  const [ingredientMatches, setIngredientMatches] = useState<IngredientMatch[]>([]);
  const [showAddIngredientsModal, setShowAddIngredientsModal] = useState(false);
  const [newIngredientQuantities, setNewIngredientQuantities] = useState<Record<string, number>>({});

  // Enhanced ingredient matching with fuzzy search and translations
  const smartIngredientMatch = (ingredient: string, inventory: any[]): IngredientMatch => {
    const cleanIngredient = ingredient.toLowerCase().trim();
    
    // First try exact match
    const exactMatch = inventory.find(item => 
      item.name.toLowerCase().trim() === cleanIngredient
    );
    
    if (exactMatch) {
      return {
        original: ingredient,
        found: exactMatch,
        suggestions: [],
        score: 100,
        isExact: true,
        isTranslation: false
      };
    }

    // Try partial matches
    const partialMatches = inventory.filter(item => {
      const itemName = item.name.toLowerCase().trim();
      return itemName.includes(cleanIngredient) || cleanIngredient.includes(itemName);
    });

    // Try translation matches
    let translationMatches: any[] = [];
    let translatedFrom = '';
    
    Object.entries(INGREDIENT_TRANSLATIONS).forEach(([english, translations]) => {
      if (translations.some(trans => trans.includes(cleanIngredient) || cleanIngredient.includes(trans))) {
        const matches = inventory.filter(item => {
          const itemName = item.name.toLowerCase().trim();
          return itemName.includes(english) || 
                 translations.some(trans => itemName.includes(trans)) ||
                 itemName === english;
        });
        if (matches.length > 0) {
          translationMatches = [...translationMatches, ...matches];
          translatedFrom = english;
        }
      }
    });

    // Try fuzzy matching (word similarity)
    const fuzzyMatches = inventory.filter(item => {
      const itemWords = item.name.toLowerCase().split(' ');
      const ingredientWords = cleanIngredient.split(' ');
      
      return itemWords.some((itemWord: string) => 
        ingredientWords.some((ingWord: string) => 
          itemWord.includes(ingWord) || ingWord.includes(itemWord) ||
          levenshteinDistance(itemWord, ingWord) <= 2
        )
      );
    });

    // Combine and score all matches
    const allMatches = [...partialMatches, ...translationMatches, ...fuzzyMatches];
    const uniqueMatches = allMatches.filter((match, index, self) => 
      index === self.findIndex(m => m.name === match.name)
    );

    // Score matches based on similarity
    const scoredMatches = uniqueMatches.map(match => ({
      ...match,
      score: calculateMatchScore(cleanIngredient, match.name.toLowerCase())
    })).sort((a, b) => b.score - a.score);

    const bestMatch = scoredMatches[0];
    
    return {
      original: ingredient,
      found: bestMatch?.score > 70 ? bestMatch : undefined,
      suggestions: scoredMatches.slice(0, 5),
      score: bestMatch?.score || 0,
      isExact: false,
      isTranslation: translationMatches.length > 0,
      translatedFrom: translatedFrom
    };
  };

  // Calculate similarity score between two strings
  const calculateMatchScore = (str1: string, str2: string): number => {
    const maxLength = Math.max(str1.length, str2.length);
    const distance = levenshteinDistance(str1, str2);
    return Math.round(((maxLength - distance) / maxLength) * 100);
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Suggest appropriate unit for ingredient
  const suggestUnit = (ingredientName: string): string => {
    const name = ingredientName.toLowerCase();
    
    if (name.includes('milk') || name.includes('oil') || name.includes('water')) return 'ml';
    if (name.includes('flour') || name.includes('sugar') || name.includes('rice')) return 'g';
    if (name.includes('meat') || name.includes('fish') || name.includes('chicken')) return 'g';
    if (name.includes('egg') || name.includes('onion') || name.includes('tomato')) return 'pcs';
    if (name.includes('herb') || name.includes('spice')) return 'tsp';
    
    return 'g'; // default
  };

  // Enhanced debug check with smart matching
  const runEnhancedDebugChecks = () => {
    if (!currentUser) {
      setDebugOutput('❌ No user logged in');
      return;
    }

    const menuDishes = getDishes(currentUser.id);
    const inventoryItems = getInventory(currentUser.id);
    
    let analysisOutput = '🧠 =================================\n';
    analysisOutput += '🧠 SMART INVENTORY-MENU ANALYSIS\n';
    analysisOutput += '🧠 =================================\n\n';
    
    // 🔍 SHOW CURRENT MENU WITH POTENTIAL NAMING ISSUES
    analysisOutput += '📋 CURRENT MENU ITEMS:\n';
    analysisOutput += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    menuDishes.forEach((dish, index) => {
      analysisOutput += `${index + 1}. "${dish.name}"\n`;
      // Check if dish name contains price patterns
      const pricePattern = /[-–]\s*([0-9]+[\.,]?[0-9]*)\s*(€|eur|euro|EUR|\$|USD)/i;
      if (pricePattern.test(dish.name)) {
        analysisOutput += `   ⚠️  WARNING: Dish name contains price information!\n`;
        analysisOutput += `   💡 Suggested clean name: "${dish.name.replace(pricePattern, '').trim()}"\n`;
      }
      if (dish.price) {
        analysisOutput += `   💰 Price: ${dish.price}\n`;
      }
    });

    const matches: IngredientMatch[] = [];
    const missing: MissingIngredient[] = [];
    
    let totalIngredients = 0;
    let foundIngredients = 0;
    let translatedIngredients = 0;

    analysisOutput += '\n🔍 INGREDIENT ANALYSIS:\n';
    analysisOutput += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    menuDishes.forEach((dish, dishIndex) => {
      analysisOutput += `\n🍽️ ANALYZING: "${dish.name}"\n`;
      
      if (dish.ingredients && Array.isArray(dish.ingredients)) {
        dish.ingredients.forEach((ingredient) => {
          totalIngredients++;
          const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.inventoryItemName;
          const match = smartIngredientMatch(ingredientName, inventoryItems);
          matches.push(match);

          if (match.found) {
            foundIngredients++;
            if (match.isTranslation) translatedIngredients++;
            
            const status = match.isExact ? '✅ EXACT' : 
                          match.isTranslation ? '🌐 TRANSLATED' : '🔍 FUZZY';
            
            analysisOutput += `  ${status} ${ingredientName}\n`;
            analysisOutput += `    ↳ Found: ${match.found.name} (${match.found.quantity} ${match.found.unit})\n`;
            
            if (match.translatedFrom) {
              analysisOutput += `    ↳ Translation: ${match.translatedFrom} → ${ingredientName}\n`;
            }
            analysisOutput += `    ↳ Confidence: ${match.score}%\n`;
          } else {
            analysisOutput += `  ❌ MISSING: ${ingredientName}\n`;
            
            if (match.suggestions.length > 0) {
              analysisOutput += `    💡 Suggestions:\n`;
              match.suggestions.slice(0, 3).forEach(suggestion => {
                analysisOutput += `      • ${suggestion.name} (${suggestion.score}% match)\n`;
              });
            }
            
            // Add to missing ingredients with smart suggestions
            const suggestedName = match.suggestions[0]?.name || ingredientName;
            const unit = suggestUnit(ingredientName);
            
            missing.push({
              name: ingredientName,
              suggestedName: suggestedName,
              category: 'Ingredient',
              unit: unit,
              quantity: 100 // default quantity
            });
          }
        });
      } else {
        analysisOutput += `  ⚠️ No ingredients defined\n`;
      }
    });

    analysisOutput += '\n📊 SUMMARY STATISTICS:\n';
    analysisOutput += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    analysisOutput += `Total Ingredients: ${totalIngredients}\n`;
    analysisOutput += `Found: ${foundIngredients} (${totalIngredients > 0 ? Math.round(foundIngredients/totalIngredients*100) : 0}%)\n`;
    analysisOutput += `Missing: ${missing.length} (${totalIngredients > 0 ? Math.round(missing.length/totalIngredients*100) : 0}%)\n`;
    analysisOutput += `Translation Matches: ${translatedIngredients}\n`;
    
    // Show available ingredients
    if (foundIngredients > 0) {
      analysisOutput += '\n✅ AVAILABLE INGREDIENTS:\n';
      analysisOutput += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
      matches.filter(match => match.found).forEach(match => {
        const stockStatus = match.found.quantity > match.found.lowStockThreshold ? '🟢' : '🟡';
        analysisOutput += `${stockStatus} ${match.found.name}: ${match.found.quantity} ${match.found.unit}\n`;
        if (match.isTranslation) {
          analysisOutput += `   🌐 Translation match from: ${match.original}\n`;
        }
      });
    }
    
    setDebugOutput(analysisOutput);
    setIngredientMatches(matches);
    setMissingIngredients(missing);
    
    // Initialize quantities for missing ingredients
    const quantities: Record<string, number> = {};
    missing.forEach(item => {
      quantities[item.name] = item.quantity;
    });
    setNewIngredientQuantities(quantities);
  };

  // New serving availability check
  const runServingAvailabilityCheck = () => {
    if (!currentUser) {
      setDebugOutput('❌ No user logged in');
      return;
    }

    const dishes = getDishes(currentUser.id);
    const capacity = getMenuServingCapacity(currentUser.id);
    
    let output = '🍽️ =================================\n';
    output += '🍽️ SERVING AVAILABILITY ANALYSIS\n';
    output += '🍽️ =================================\n\n';
    
    output += '📊 EXPLANATION OF VALUES:\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    output += '• The "Used" column shows cumulative ingredient consumption\n';
    output += '• For example: "2300" = 2.3 liters of Olive Oil has been used across all orders\n';
    output += '• Note: If unit is "l" (liters), then 2300 = 2.3L = 2300ml\n';
    output += '• This helps track costs and plan inventory restocking\n';
    output += '• Values reset when you use the "Reset Usage Counters" button\n\n';
    
    output += '🍽️ CURRENT SERVING CAPACITY:\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    
    capacity.forEach((item, index) => {
      const statusIcon = item.status === 'available' ? '✅' : 
                        item.status === 'limited' ? '⚠️' : '❌';
      
      output += `${index + 1}. ${statusIcon} ${item.dishName}\n`;
      output += `   📊 Max servings: ${item.maxServings === 999 ? '∞ (no ingredients defined)' : item.maxServings}\n`;
      
      if (item.limitingIngredient) {
        output += `   🚫 Limited by: ${item.limitingIngredient}\n`;
      }
      
      if (item.status === 'unavailable') {
        output += `   ❌ Cannot be served - missing ingredients\n`;
      } else if (item.status === 'limited') {
        output += `   ⚠️ Limited servings available\n`;
      } else {
        output += `   ✅ Fully available\n`;
      }
      output += '\n';
    });
    
    // Test specific scenarios
    output += '🧪 SERVING LIMIT SCENARIOS:\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    
    dishes.slice(0, 3).forEach((dish, index) => {
      const testQuantities = [1, 5, 10, 20];
      
      output += `\n🍽️ Testing: ${dish.name}\n`;
      
      testQuantities.forEach(qty => {
        const result = checkDishServingAvailability(currentUser.id, dish, qty);
        const status = result.canServe ? '✅' : '❌';
        output += `   ${status} ${qty} servings: ${result.availabilityMessage}\n`;
        
        if (!result.canServe && result.limitingIngredient) {
          output += `     🚫 Blocked by: ${result.limitingIngredient}\n`;
        }
      });
    });
    
    output += '\n💡 HOW IT WORKS:\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    output += '1. System calculates ingredient requirements per serving\n';
    output += '2. Compares with current inventory levels\n';
    output += '3. Finds the limiting ingredient (smallest ratio)\n';
    output += '4. If order exceeds capacity → shows error message\n';
    output += '5. When order is processed → ingredients are consumed automatically\n';
    output += '6. Real-time availability updates after each order\n';
    
    setDebugOutput(output);
  };

  // Add missing ingredients to inventory
  const addMissingIngredientsToInventory = async () => {
    if (!currentUser) return;

    try {
      let addedCount = 0;
      const errors: string[] = [];

      for (const ingredient of missingIngredients) {
        const quantity = newIngredientQuantities[ingredient.name] || ingredient.quantity;
        
        if (quantity > 0) {
          try {
            await addInventoryItem(currentUser.id, {
              name: ingredient.suggestedName,
              quantity: quantity,
              unit: ingredient.unit,
              category: ingredient.category,
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
              lowStockThreshold: Math.max(10, quantity * 0.1)
            });
            addedCount++;
          } catch (error) {
            errors.push(`Failed to add ${ingredient.name}: ${error}`);
          }
        }
      }

      if (addedCount > 0) {
        toast({
          title: "✅ Success!",
          description: `Added ${addedCount} ingredients to inventory`,
        });
        
        // Refresh the analysis
        setTimeout(() => {
          runEnhancedDebugChecks();
        }, 1000);
      }

      if (errors.length > 0) {
        toast({
          title: "⚠️ Partial Success",
          description: `Added ${addedCount} items, but ${errors.length} failed`,
          variant: "destructive"
        });
      }

      setShowAddIngredientsModal(false);
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to add ingredients to inventory",
        variant: "destructive"
      });
    }
  };

  const updateIngredientQuantity = (ingredientName: string, quantity: number) => {
    setNewIngredientQuantities(prev => ({
      ...prev,
      [ingredientName]: quantity
    }));
  };

  return (
    <AppLayout pageTitle="Smart Inventory-Menu Integration">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Main Analysis Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🧠 Smart Ingredient Analysis
              {missingIngredients.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {missingIngredients.length} Missing
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button onClick={runEnhancedDebugChecks} disabled={!currentUser}>
                🔍 Run Smart Analysis
              </Button>
              <Button onClick={runServingAvailabilityCheck} disabled={!currentUser} variant="outline">
                🍽️ Check Serving Limits
              </Button>
              {missingIngredients.length > 0 && (
                <Button 
                  onClick={() => setShowAddIngredientsModal(true)} 
                  variant="outline"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add {missingIngredients.length} Missing Ingredients
                </Button>
              )}
            </div>
            
            {debugOutput && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Analysis Results:</h3>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                  {debugOutput}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ingredient Matching Results */}
        {ingredientMatches.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  Available Ingredients ({ingredientMatches.filter(m => m.found).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ingredientMatches.filter(match => match.found).map((match, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{match.original}</div>
                        <div className="text-sm text-green-600 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Found: {match.found.name} ({match.found.quantity} {match.found.unit})
                          {match.isTranslation && (
                            <Badge variant="secondary" className="text-xs">
                              🌐 Translated from {match.translatedFrom}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Stock: {match.found.quantity > match.found.lowStockThreshold ? '🟢 Good' : '🟡 Low'}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={match.score > 90 ? "default" : match.score > 70 ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {match.score}% match
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {ingredientMatches.filter(m => m.found).length === 0 && (
                    <p className="text-gray-500 text-sm">No ingredients found in inventory</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Missing Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <X className="w-5 h-5" />
                  Missing Ingredients ({ingredientMatches.filter(m => !m.found).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ingredientMatches.filter(match => !match.found).map((match, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{match.original}</div>
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <X className="w-4 h-4" />
                          Not found in inventory
                        </div>
                        {match.suggestions.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Suggestions: {match.suggestions.slice(0, 2).map(s => s.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {match.score}% match
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {ingredientMatches.filter(m => !m.found).length === 0 && (
                    <p className="text-gray-500 text-sm">All ingredients found in inventory!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Legacy Ingredient Matching Results - Keep for backward compatibility */}
        {ingredientMatches.length > 0 && false && (
          <Card>
            <CardHeader>
              <CardTitle>🔗 Ingredient Matching Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {ingredientMatches.map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{match.original}</div>
                      {match.found ? (
                        <div className="text-sm text-green-600 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Found: {match.found.name} ({match.found.quantity} {match.found.unit})
                          {match.isTranslation && (
                            <Badge variant="secondary" className="text-xs">
                              🌐 Translated from {match.translatedFrom}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-red-600 flex items-center gap-2">
                          <X className="w-4 h-4" />
                          Not found in inventory
                        </div>
                      )}
                      {match.suggestions.length > 0 && !match.found && (
                        <div className="text-xs text-gray-500 mt-1">
                          Suggestions: {match.suggestions.slice(0, 2).map(s => s.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={match.score > 90 ? "default" : match.score > 70 ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {match.score}% match
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Missing Ingredients Modal */}
        {showAddIngredientsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Missing Ingredients to Inventory
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Review and adjust quantities for missing ingredients before adding them to your inventory.
              </p>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {missingIngredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{ingredient.name}</div>
                      <div className="text-xs text-gray-500">
                        Will be added as: {ingredient.suggestedName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`qty-${index}`} className="text-xs">Qty:</Label>
                      <Input
                        id={`qty-${index}`}
                        type="number"
                        value={newIngredientQuantities[ingredient.name] || ingredient.quantity}
                        onChange={(e) => updateIngredientQuantity(ingredient.name, parseInt(e.target.value) || 0)}
                        className="w-20 text-sm"
                        min="0"
                      />
                      <span className="text-xs text-gray-500 w-8">{ingredient.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowAddIngredientsModal(false)}>
                  Cancel
                </Button>
                <Button onClick={addMissingIngredientsToInventory} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add All Ingredients
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
