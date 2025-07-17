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

export function saveInventory(userId?: string | null, inventory: InventoryItem[]): void {
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

export function addInventoryItem(userId?: string | null, item: Omit<InventoryItem, 'id'>): InventoryItem | null {
  try {
    const inventory = getInventory(userId);
    const newItem: InventoryItem = {
      ...item,
      id: generateId(),
      lastRestocked: new Date().toISOString(),
    };
    inventory.push(newItem);
    saveInventory(userId, inventory);
    return newItem;
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return null;
  }
}

export function updateInventoryItem(userId?: string | null, itemId: string, updates: Partial<InventoryItem>): InventoryItem | null {
  try {
    const inventory = getInventory(userId);
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;
    
    inventory[itemIndex] = { ...inventory[itemIndex], ...updates };
    saveInventory(userId, inventory);
    return inventory[itemIndex];
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return null;
  }
}

export function removeInventoryItem(userId?: string | null, itemId: string): boolean {
  try {
    const inventory = getInventory(userId);
    const filteredInventory = inventory.filter(item => item.id !== itemId);
    if (filteredInventory.length === inventory.length) return false; // Item not found
    saveInventory(userId, filteredInventory);
    return true;
  } catch (error) {
    console.error('Error removing inventory item:', error);
    return false;
  }
}

export function clearAllInventory(userId?: string | null): boolean {
  try {
    const inventoryStorageKey = getUserInventoryStorageKey(userId);
    localStorage.removeItem(inventoryStorageKey);
    return true;
  } catch (error) {
    console.error('Error clearing all inventory:', error);
    return false;
  }
}

export function addIngredientToInventoryIfNotExists(userId?: string | null, ingredient: any): InventoryItem | null {
  try {
    const inventory = getInventory(userId);
    
    // Check if the ingredient already exists (by name)
    const existingItem = inventory.find(item => 
      item.name.toLowerCase() === ingredient.name.toLowerCase()
    );
    
    if (existingItem) {
      // If it exists, update the quantity
      const updatedItem = updateInventoryItem(userId, existingItem.id, {
        quantity: existingItem.quantity + (ingredient.quantity || 1),
        lastRestocked: new Date().toISOString()
      });
      return updatedItem;
    } else {
      // If it doesn't exist, add it as a new item
      const newItem: Omit<InventoryItem, 'id'> = {
        name: ingredient.name,
        quantity: ingredient.quantity || 1,
        unit: ingredient.unit || 'pcs',
        category: ingredient.category || 'Pantry',
        lowStockThreshold: ingredient.lowStockThreshold || 5,
        lastRestocked: new Date().toISOString(),
        expiryDate: ingredient.expiryDate || undefined,
        quantityUsed: 0,
        image: ingredient.image || "https://placehold.co/60x60.png",
        aiHint: ingredient.aiHint || ingredient.name.toLowerCase().split(' ').slice(0, 2).join(' ')
      };
      
      return addInventoryItem(userId, newItem);
    }
  } catch (error) {
    console.error('Error adding ingredient to inventory:', error);
    return null;
  }
}

export function recordIngredientUsage(userId?: string | null, ingredientName: string, quantityUsed: number): boolean {
  try {
    const inventory = getInventory(userId);
    const itemIndex = inventory.findIndex(item => 
      item.name.toLowerCase() === ingredientName.toLowerCase()
    );
    
    if (itemIndex === -1) return false; // Item not found
    
    const currentItem = inventory[itemIndex];
    const newQuantityUsed = (currentItem.quantityUsed || 0) + quantityUsed;
    const newQuantity = Math.max(0, currentItem.quantity - quantityUsed);
    
    const updated = updateInventoryItem(userId, currentItem.id, {
      quantity: newQuantity,
      quantityUsed: newQuantityUsed
    });
    
    return updated !== null;
  } catch (error) {
    console.error('Error recording ingredient usage:', error);
    return false;
  }
}

export interface RawIngredient {
  name: string;
  quantity: number;
  unit: string;
}
