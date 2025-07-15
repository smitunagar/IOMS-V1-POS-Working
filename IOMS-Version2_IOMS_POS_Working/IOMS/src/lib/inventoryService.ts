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

export function getInventory(userId?: string | null): InventoryItem[] {
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

export function saveInventory(inventory: InventoryItem[], userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const inventoryStorageKey = getUserInventoryStorageKey(userId);
    localStorage.setItem(inventoryStorageKey, JSON.stringify(inventory));
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

export function addIngredientToInventoryIfNotExists(ingredient: RawIngredient, userId?: string | null): InventoryItem | null {
  if (typeof window === 'undefined') return null;
  
  const currentInventory = getInventory(userId);
  const existingItem = currentInventory.find(
    item => item.name.toLowerCase() === ingredient.name.toLowerCase()
  );

  if (existingItem) {
    return null; 
  }

  const newItem: InventoryItem = {
    id: generateId(),
    name: ingredient.name,
    quantity: ingredient.quantity, 
    unit: ingredient.unit,
    category: "Pantry", 
    lowStockThreshold: Math.max(1, Math.floor(ingredient.quantity * 0.2)), 
    lastRestocked: new Date().toISOString(), 
    expiryDate: undefined, 
    quantityUsed: 0,
    image: "https://placehold.co/60x60.png",
    aiHint: ingredient.name.toLowerCase().split(' ').slice(0, 2).join(' '),
  };

  const updatedInventory = [...currentInventory, newItem];
  saveInventory(updatedInventory, userId);
  return newItem;
}

export function addOrUpdateIngredientInInventory(ingredient: RawIngredient, userId?: string | null): InventoryItem {
  if (typeof window === 'undefined') {
    throw new Error('Cannot access localStorage in server environment');
  }
  
  const currentInventory = getInventory(userId);
  const existingItemIndex = currentInventory.findIndex(
    item => item.name.toLowerCase() === ingredient.name.toLowerCase()
  );

  if (existingItemIndex > -1) {
    // Update existing item - add to current quantity
    const existingItem = currentInventory[existingItemIndex];
    
    // Check if units match before adding quantities
    if (existingItem.unit.toLowerCase() !== ingredient.unit.toLowerCase()) {
      console.warn(`Unit mismatch for ${ingredient.name}: existing unit ${existingItem.unit}, new unit ${ingredient.unit}. Creating new item instead.`);
      // If units don't match, create a new item with a modified name
      const newItem: InventoryItem = {
        id: generateId(),
        name: `${ingredient.name} (${ingredient.unit})`,
        quantity: ingredient.quantity, 
        unit: ingredient.unit,
        category: "Pantry", 
        lowStockThreshold: Math.max(1, Math.floor(ingredient.quantity * 0.2)), 
        lastRestocked: new Date().toISOString(), 
        expiryDate: undefined, 
        quantityUsed: 0,
        image: "https://placehold.co/60x60.png",
        aiHint: ingredient.name.toLowerCase().split(' ').slice(0, 2).join(' '),
      };

      const updatedInventory = [...currentInventory, newItem];
      saveInventory(updatedInventory, userId);
      return newItem;
    }
    
    const updatedItem: InventoryItem = {
      ...existingItem,
      quantity: existingItem.quantity + ingredient.quantity,
      lastRestocked: new Date().toISOString(),
    };
    
    currentInventory[existingItemIndex] = updatedItem;
    saveInventory(currentInventory, userId);
    return updatedItem;
  } else {
    // Add new item
    const newItem: InventoryItem = {
      id: generateId(),
      name: ingredient.name,
      quantity: ingredient.quantity, 
      unit: ingredient.unit,
      category: "Pantry", 
      lowStockThreshold: Math.max(1, Math.floor(ingredient.quantity * 0.2)), 
      lastRestocked: new Date().toISOString(), 
      expiryDate: ingredient.expiryDate || undefined, 
      quantityUsed: 0,
      image: "https://placehold.co/60x60.png",
      aiHint: ingredient.name.toLowerCase().split(' ').slice(0, 2).join(' '),
    };

    const updatedInventory = [...currentInventory, newItem];
    saveInventory(updatedInventory, userId);
    return newItem;
  }
}

export function recordIngredientUsage(ingredientName: string, consumedQuantity: number, consumedUnit: string, userId?: string | null): void {
  if (typeof window === 'undefined') return;
  const currentInventory = getInventory(userId);
  const itemIndex = currentInventory.findIndex(
    item => item.name.toLowerCase() === ingredientName.toLowerCase()
  );

  if (itemIndex > -1) {
    const item = currentInventory[itemIndex];

    if (item.unit.toLowerCase() !== consumedUnit.toLowerCase()) {
      console.warn(`Unit mismatch for ${ingredientName}: inventory unit ${item.unit}, consumed unit ${consumedUnit}. Ingredient usage not recorded.`);
      return;
    }

    const newQuantity = Math.max(0, item.quantity - consumedQuantity);
    const newQuantityUsed = (item.quantityUsed || 0) + consumedQuantity;

    currentInventory[itemIndex] = {
      ...item,
      quantity: newQuantity,
      quantityUsed: newQuantityUsed,
    };
    saveInventory(currentInventory, userId);
  } else {
    console.warn(`Ingredient "${ingredientName}" not found in inventory (user: ${userId}). Usage not recorded.`);
  }
}

export function updateInventoryItem(itemId: string, updates: Partial<Omit<InventoryItem, 'id'>>, userId?: string | null): InventoryItem | null {
  if (typeof window === 'undefined') return null;
  
  const currentInventory = getInventory(userId);
  const itemIndex = currentInventory.findIndex(item => item.id === itemId);

  if (itemIndex > -1) {
    const originalItem = currentInventory[itemIndex];
    currentInventory[itemIndex] = { 
      ...originalItem, 
      ...updates,
      quantityUsed: updates.quantityUsed !== undefined ? updates.quantityUsed : originalItem.quantityUsed || 0,
    };
    // If quantity changes, it implies a restock or manual adjustment.
    if(updates.quantity !== undefined && originalItem.quantity !== updates.quantity) {
      currentInventory[itemIndex].lastRestocked = new Date().toISOString();
    }
    saveInventory(currentInventory, userId);
    return currentInventory[itemIndex];
  } else {
    console.warn(`Item with id ${itemId} not found for update (user: ${userId}).`);
    return null;
  }
}

export function removeInventoryItem(itemId: string, userId?: string | null): boolean {
    if (typeof window === 'undefined') return false;
    let currentInventory = getInventory(userId);
    const initialLength = currentInventory.length;
    currentInventory = currentInventory.filter(item => item.id !== itemId);
    if (currentInventory.length < initialLength) {
      saveInventory(currentInventory, userId);
      return true;
    }
    return false;
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