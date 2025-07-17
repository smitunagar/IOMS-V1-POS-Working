// IMPORTANT: This service uses localStorage and will only work in the browser.
// Ensure it's called within useEffect or client-side event handlers.
import { parse as parseDateFns, isValid, format as formatDateFns } from 'date-fns';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  lowStockThreshold: number;
  lastRestocked?: string; // ISO date string
  expiryDate?: string; // ISO date string YYYY-MM-DD
  quantityUsed: number;
  image?: string; // URL to the image
  aiHint?: string; // Hint for AI image generation
}

const INVENTORY_STORAGE_KEY_BASE = 'restaurantInventory';

function generateId(): string {
  return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function getUserInventoryStorageKey(userId?: string | null): string {
  return `${INVENTORY_STORAGE_KEY_BASE}_${userId || 'default'}`;
}

export function getInventory(userId: string | null = null): InventoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const inventoryStorageKey = getUserInventoryStorageKey(userId);
    const storedInventory = localStorage.getItem(inventoryStorageKey);
    if (storedInventory) {
      const parsed = JSON.parse(storedInventory) as InventoryItem[];
      return parsed.map(item => ({
        ...item,
        quantityUsed: item.quantityUsed || 0,
        expiryDate: item.expiryDate || undefined,
        image: item.image || "https://placehold.co/60x60.png",
        aiHint: item.aiHint || item.name.toLowerCase().split(' ').slice(0, 2).join(' '),
      }));
    } else {
      const emptyInventory: InventoryItem[] = [];
      localStorage.setItem(inventoryStorageKey, JSON.stringify(emptyInventory));
      return emptyInventory;
    }
  } catch (error) {
    console.error(`Error accessing localStorage for inventory (user: ${userId}):`, error);
    return [];
  }
}

export function saveInventory(inventory: InventoryItem[], userId: string | null = null): void {
  if (typeof window === 'undefined') return;
  try {
    const inventoryStorageKey = getUserInventoryStorageKey(userId);
    localStorage.setItem(inventoryStorageKey, JSON.stringify(inventory));
    
    // 🔥 NEW: Trigger inventory update event to refresh menu availability
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inventory-updated'));
    }
  } catch (error) {
    console.error(`Error saving inventory to localStorage (user: ${userId}):`, error);
  }
}





export interface RawIngredient {
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string; // Optional expiry date in YYYY-MM-DD format
}

/**
 * Records ingredient usage and updates inventory quantities
 */
export function recordIngredientUsage(
  userId: string | null,
  ingredientName: string,
  quantity: number,
  unit: string
): { success: boolean; message: string } {
  if (!userId || typeof window === 'undefined') {
    return { success: false, message: 'No user ID or not in browser environment' };
  }

  try {
    const inventory = getInventory(userId);
    const inventoryItem = findInventoryItemByName(inventory, ingredientName);

    if (!inventoryItem) {
      return { success: false, message: `Ingredient '${ingredientName}' not found in inventory` };
    }

    // Convert units if needed
    const convertedQuantity = convertUnits(quantity, unit, inventoryItem.unit);
    
    if (inventoryItem.quantity < convertedQuantity) {
      return { 
        success: false, 
        message: `Insufficient stock. Available: ${inventoryItem.quantity} ${inventoryItem.unit}, Required: ${convertedQuantity} ${inventoryItem.unit}` 
      };
    }

    // Update inventory
    inventoryItem.quantity -= convertedQuantity;
    inventoryItem.quantityUsed += convertedQuantity;

    // Save updated inventory
    saveInventory(inventory, userId);

    return { 
      success: true, 
      message: `Successfully used ${convertedQuantity} ${inventoryItem.unit} of ${ingredientName}` 
    };
  } catch (error) {
    console.error('Error recording ingredient usage:', error);
    return { success: false, message: 'Error recording ingredient usage' };
  }
}

/**
 * Helper function to find inventory item by name (case-insensitive)
 */
function findInventoryItemByName(inventory: InventoryItem[], searchName: string): InventoryItem | null {
  return inventory.find(item => 
    item.name.toLowerCase() === searchName.toLowerCase() ||
    item.name.toLowerCase().includes(searchName.toLowerCase()) ||
    searchName.toLowerCase().includes(item.name.toLowerCase())
  ) || null;
}

/**
 * Helper function to convert units
 */
function convertUnits(fromAmount: number, fromUnit: string, toUnit: string): number {
  // Normalize units
  const normalizedFromUnit = fromUnit.toLowerCase().trim();
  const normalizedToUnit = toUnit.toLowerCase().trim();

  // If units are the same, no conversion needed
  if (normalizedFromUnit === normalizedToUnit) {
    return fromAmount;
  }

  // Common unit conversions
  const conversions: Record<string, Record<string, number>> = {
    'g': { 'kg': 0.001, 'oz': 0.035274, 'lb': 0.00220462 },
    'kg': { 'g': 1000, 'oz': 35.274, 'lb': 2.20462 },
    'ml': { 'l': 0.001, 'oz': 0.033814, 'cup': 0.00422675 },
    'l': { 'ml': 1000, 'oz': 33.814, 'cup': 4.22675 },
    'oz': { 'g': 28.3495, 'kg': 0.0283495, 'ml': 29.5735, 'l': 0.0295735, 'cup': 0.125 },
    'cup': { 'ml': 236.588, 'l': 0.236588, 'oz': 8 },
    'pcs': { 'piece': 1, 'unit': 1 },
    'piece': { 'pcs': 1, 'unit': 1 },
    'unit': { 'pcs': 1, 'piece': 1 }
  };

  if (conversions[normalizedFromUnit] && conversions[normalizedFromUnit][normalizedToUnit]) {
    return fromAmount * conversions[normalizedFromUnit][normalizedToUnit];
  }

  // If no conversion found, assume 1:1 ratio
  console.warn(`No unit conversion found from ${fromUnit} to ${toUnit}, using 1:1 ratio`);
  return fromAmount;
}

/**
 * Adds a new item to the inventory
 */
export function addInventoryItem(userId: string | null, item: Partial<InventoryItem>): InventoryItem {
  if (!userId || typeof window === 'undefined') {
    throw new Error('No user ID or not in browser environment');
  }

  const inventory = getInventory(userId);
  
  const newItem: InventoryItem = {
    id: generateId(),
    name: item.name || '',
    quantity: item.quantity || 0,
    unit: item.unit || '',
    category: item.category || 'Other',
    lowStockThreshold: item.lowStockThreshold || 5,
    quantityUsed: item.quantityUsed || 0,
    lastRestocked: item.lastRestocked || new Date().toISOString(),
    expiryDate: item.expiryDate || undefined,
    image: item.image || "https://placehold.co/60x60.png",
    aiHint: item.aiHint || (item.name ? item.name.toLowerCase().split(' ').slice(0, 2).join(' ') : ''),
  };

  inventory.push(newItem);
  saveInventory(inventory, userId);
  
  return newItem;
}

/**
 * Updates an existing inventory item
 */
export function updateInventoryItem(
  userId: string | null, 
  itemId: string, 
  updates: Partial<InventoryItem>
): { success: boolean; message: string; item?: InventoryItem } {
  if (!userId || typeof window === 'undefined') {
    return { success: false, message: 'No user ID or not in browser environment' };
  }

  try {
    const inventory = getInventory(userId);
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return { success: false, message: 'Item not found in inventory' };
    }

    // Update the item
    inventory[itemIndex] = {
      ...inventory[itemIndex],
      ...updates,
      id: itemId, // Ensure ID doesn't change
    };

    saveInventory(inventory, userId);
    
    return { 
      success: true, 
      message: 'Item updated successfully',
      item: inventory[itemIndex]
    };
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return { success: false, message: 'Error updating item' };
  }
}

/**
 * Removes an item from the inventory
 */
export function removeInventoryItem(userId: string | null, itemId: string): boolean {
  if (!userId || typeof window === 'undefined') {
    return false;
  }

  try {
    const inventory = getInventory(userId);
    const filteredInventory = inventory.filter(item => item.id !== itemId);
    
    if (filteredInventory.length === inventory.length) {
      return false; // Item not found
    }

    saveInventory(filteredInventory, userId);
    return true;
  } catch (error) {
    console.error('Error removing inventory item:', error);
    return false;
  }
}

/**
 * Clears all inventory items for a user
 */
export function clearAllInventory(userId: string | null): boolean {
  if (!userId || typeof window === 'undefined') {
    return false;
  }

  try {
    saveInventory([], userId);
    return true;
  } catch (error) {
    console.error('Error clearing inventory:', error);
    return false;
  }
}

/**
 * Adds an ingredient to inventory only if it doesn't already exist
 * Returns the item if added, null if it already exists
 */
export function addIngredientToInventoryIfNotExists(
  userId: string | null, 
  ingredient: RawIngredient
): InventoryItem | null {
  if (!userId || typeof window === 'undefined') {
    return null;
  }

  try {
    const inventory = getInventory(userId);
    
    // Check if ingredient already exists (case-insensitive name matching)
    const existingItem = inventory.find(item => 
      item.name.toLowerCase() === ingredient.name.toLowerCase()
    );

    if (existingItem) {
      // Item already exists, return null to indicate no addition
      return null;
    }

    // Create new inventory item
    const newItem: InventoryItem = {
      id: generateId(),
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      category: 'Other', // Default category
      lowStockThreshold: 5, // Default threshold
      quantityUsed: 0,
      lastRestocked: new Date().toISOString(),
      expiryDate: ingredient.expiryDate || undefined,
      image: "https://placehold.co/60x60.png",
      aiHint: ingredient.name.toLowerCase().split(' ').slice(0, 2).join(' '),
    };

    inventory.push(newItem);
    saveInventory(inventory, userId);
    
    return newItem;
  } catch (error) {
    console.error('Error adding ingredient to inventory:', error);
    return null;
  }
}

/**
 * Adds or updates an ingredient in inventory
 * If the ingredient exists, updates the quantity
 * If it doesn't exist, adds it as a new item
 */
export function addOrUpdateIngredientInInventory(
  ingredient: RawIngredient & { expiryDate?: string },
  userId: string | null
): InventoryItem {
  if (!userId || typeof window === 'undefined') {
    throw new Error('No user ID or not in browser environment');
  }

  const inventory = getInventory(userId);
  
  // Check if ingredient already exists (case-insensitive name matching)
  const existingItemIndex = inventory.findIndex(item => 
    item.name.toLowerCase() === ingredient.name.toLowerCase()
  );

  if (existingItemIndex !== -1) {
    // Update existing item
    const existingItem = inventory[existingItemIndex];
    const updatedItem: InventoryItem = {
      ...existingItem,
      quantity: existingItem.quantity + ingredient.quantity,
      lastRestocked: new Date().toISOString(),
      expiryDate: ingredient.expiryDate || existingItem.expiryDate,
    };
    
    inventory[existingItemIndex] = updatedItem;
    saveInventory(inventory, userId);
    return updatedItem;
  } else {
    // Add new item
    const newItem: InventoryItem = {
      id: generateId(),
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      category: 'Other', // Default category
      lowStockThreshold: 5, // Default threshold
      quantityUsed: 0,
      lastRestocked: new Date().toISOString(),
      expiryDate: ingredient.expiryDate || undefined,
      image: "https://placehold.co/60x60.png",
      aiHint: ingredient.name.toLowerCase().split(' ').slice(0, 2).join(' '),
    };

    inventory.push(newItem);
    saveInventory(inventory, userId);
    return newItem;
  }
}

export interface ProcessedCSVItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  lowStockThreshold?: number;
  expiryDate?: string; // YYYY-MM-DD
  imageURL?: string;
  aiHint?: string;
}

export function batchAddOrUpdateInventoryItems(itemsToProcess: ProcessedCSVItem[], userId?: string | null): { added: number; updated: number; errors: number } {
  if (typeof window === 'undefined') return { added: 0, updated: 0, errors: itemsToProcess.length };

  const currentInventory = getInventory(userId);
  let addedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  itemsToProcess.forEach(csvItem => {
    try {
      const existingItemIndex = currentInventory.findIndex(
        invItem => invItem.name.toLowerCase() === csvItem.name.toLowerCase()
      );

      if (existingItemIndex > -1) {
        // Update existing item
        const originalItem = currentInventory[existingItemIndex];
        const updates: Partial<InventoryItem> = {
          quantity: csvItem.quantity,
          unit: csvItem.unit,
          category: csvItem.category || originalItem.category,
          lowStockThreshold: csvItem.lowStockThreshold || originalItem.lowStockThreshold,
          expiryDate: csvItem.expiryDate || originalItem.expiryDate,
          image: csvItem.imageURL || originalItem.image,
          aiHint: csvItem.aiHint || originalItem.aiHint || csvItem.name.toLowerCase().split(' ').slice(0, 2).join(' '),
          lastRestocked: originalItem.quantity !== csvItem.quantity ? new Date().toISOString() : originalItem.lastRestocked,
        };
        currentInventory[existingItemIndex] = { ...originalItem, ...updates };
        updatedCount++;
      } else {
        // Add new item
        const newItem: InventoryItem = {
          id: generateId(),
          name: csvItem.name,
          quantity: csvItem.quantity,
          unit: csvItem.unit,
          category: csvItem.category || "Pantry",
          lowStockThreshold: csvItem.lowStockThreshold || Math.max(1, Math.floor(csvItem.quantity * 0.2)),
          lastRestocked: new Date().toISOString(),
          expiryDate: csvItem.expiryDate,
          quantityUsed: 0,
          image: csvItem.imageURL || "https://placehold.co/60x60.png",
          aiHint: csvItem.aiHint || csvItem.name.toLowerCase().split(' ').slice(0, 2).join(' '),
        };
        currentInventory.push(newItem);
        addedCount++;
      }
    } catch (e) {
      console.error("Error processing CSV item:", csvItem.name, e);
      errorCount++;
    }
  });

  saveInventory(currentInventory, userId);
  return { added: addedCount, updated: updatedCount, errors: errorCount };
}
