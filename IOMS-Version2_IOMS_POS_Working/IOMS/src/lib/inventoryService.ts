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

export interface RawIngredient {
  name: string;
  quantity: number;
  unit: string;
}
