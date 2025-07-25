// Inventory Service
// Provides functions to manage inventory in localStorage

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  lowStockThreshold?: number;
  expiryDate?: string;
  image?: string;
  aiHint?: string;
  quantityUsed?: number;
  totalUsed?: number;
}

const INVENTORY_KEY_PREFIX = 'inventory_';

export function getInventory(userId: string): InventoryItem[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(INVENTORY_KEY_PREFIX + userId);
  if (!data) return [];
  try {
    return JSON.parse(data) as InventoryItem[];
  } catch {
    return [];
  }
}

export function addInventoryItem(userId: string, item: InventoryItem): InventoryItem | null {
  if (typeof window === 'undefined') return null;
  const inventory = getInventory(userId);
  const newItem = { ...item, id: item.id || Date.now().toString(), quantityUsed: item.quantityUsed || 0, totalUsed: item.totalUsed || 0 };
  inventory.push(newItem);
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(inventory));
  return newItem;
}

export function updateInventoryItem(userId: string, item: InventoryItem): boolean {
  if (typeof window === 'undefined') return false;
  const inventory = getInventory(userId);
  const idx = inventory.findIndex(i => i.id === item.id);
  if (idx === -1) return false;
  inventory[idx] = item;
  // Always persist the updated inventory array
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(inventory));
  return true;
}

export function removeInventoryItem(userId: string, itemId: string): boolean {
  if (typeof window === 'undefined') return false;
  const inventory = getInventory(userId);
  const newInventory = inventory.filter(i => i.id !== itemId);
  if (newInventory.length === inventory.length) return false;
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(newInventory));
  return true;
}

export function addOrUpdateIngredientInInventory(userId: string, ingredient: InventoryItem): InventoryItem {
  const inventory = getInventory(userId);
  const idx = inventory.findIndex(i => i.name.toLowerCase() === ingredient.name.toLowerCase());
  if (idx !== -1) {
    inventory[idx] = { ...inventory[idx], ...ingredient, quantityUsed: inventory[idx].quantityUsed || 0, totalUsed: inventory[idx].totalUsed || 0 };
  } else {
    inventory.push({ ...ingredient, id: ingredient.id || Date.now().toString(), quantityUsed: ingredient.quantityUsed || 0, totalUsed: ingredient.totalUsed || 0 });
  }
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(inventory));
  return ingredient;
}

export function addIngredientToInventoryIfNotExists(userId: string, ingredient: InventoryItem): boolean {
  const inventory = getInventory(userId);
  const exists = inventory.some(i => i.name.toLowerCase() === ingredient.name.toLowerCase());
  if (!exists) {
    addInventoryItem(userId, ingredient);
    return true;
  }
  return false;
}

export function getInventoryAlerts(userId: string): string[] {
  const inventory = getInventory(userId);
  return inventory.filter(i => i.lowStockThreshold && i.quantity <= i.lowStockThreshold)
    .map(i => `Low stock: ${i.name} (${i.quantity} ${i.unit})`);
}

export function updateInventoryAlerts(userId: string): void {
  if (typeof window === 'undefined') return;
  // Placeholder: In a real app, this would update alert state in a DB or context
  // For now, just triggers a localStorage event
  localStorage.setItem('inventory_alerts_' + userId, Date.now().toString());
}

export function saveInventory(userId: string, inventory: InventoryItem[]): void {
  localStorage.setItem(INVENTORY_KEY_PREFIX + userId, JSON.stringify(inventory));
}

// Inventory alert type for low stock notifications
export interface InventoryAlert {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  message: string;
}

// Generate inventory alerts for low stock items
export function getInventoryAlertsDetailed(userId: string): InventoryAlert[] {
  const inventory = getInventory(userId);
  return inventory
    .filter(i => i.lowStockThreshold !== undefined && i.quantity <= (i.lowStockThreshold ?? 0))
    .map(i => ({
      itemId: i.id,
      itemName: i.name,
      quantity: i.quantity,
      unit: i.unit,
      message: `Low stock: ${i.name} (${i.quantity} ${i.unit})`,
    }));
}

// Placeholder for recordIngredientUsage to resolve import in posInventoryIntegration
export function recordIngredientUsage(userId: string, dish: any, quantity: number): void {
  // No-op placeholder
} 