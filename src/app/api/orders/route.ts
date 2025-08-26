import { NextRequest, NextResponse } from 'next/server';
import { getInventory, updateInventoryAlerts } from '@/lib/inventoryService';
import { getDishes } from '@/lib/menuService';

// Sample orders data
let orders = [
  {
    id: 'order_001',
    orderType: 'dine-in',
    status: 'Completed',
    customerInfo: { tableNumber: '1' },
    items: [
      { name: 'Chicken Curry', quantity: 1, unitPrice: 10.00 },
      { name: 'Naan Bread', quantity: 2, unitPrice: 2.00 }
    ],
    totalAmount: 14.00,
    createdAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T11:15:00Z',
    paymentMode: 'card',
    tipAmount: 2.00,
    amountPaid: 16.00
  },
  {
    id: 'order_002',
    orderType: 'delivery',
    status: 'Completed',
    customerInfo: { name: 'John Doe', address: '123 Main St' },
    items: [
      { name: 'Fish Curry', quantity: 1, unitPrice: 10.50 },
      { name: 'Naan Bread', quantity: 2, unitPrice: 2.00 }
    ],
    totalAmount: 14.50,
    createdAt: '2024-01-15T12:00:00Z',
    completedAt: '2024-01-15T12:45:00Z',
    paymentMode: 'cash',
    tipAmount: 1.50,
    amountPaid: 16.00
  },
  {
    id: 'order_003',
    orderType: 'dine-in',
    status: 'Completed',
    customerInfo: { tableNumber: '3' },
    items: [
      { name: 'Lamb Korma', quantity: 1, unitPrice: 11.00 },
      { name: 'Dal Channa', quantity: 1, unitPrice: 10.00 },
      { name: 'Coca Cola', quantity: 2, unitPrice: 2.50 }
    ],
    totalAmount: 26.00,
    createdAt: '2024-01-15T13:15:00Z',
    completedAt: '2024-01-15T14:30:00Z',
    paymentMode: 'card',
    tipAmount: 3.00,
    amountPaid: 29.00
  },
  {
    id: 'order_004',
    orderType: 'take-away',
    status: 'Pending',
    customerInfo: { name: 'Sarah Johnson', phone: '+49 123 456 789' },
    items: [
      { name: 'Chicken Tikka Masala', quantity: 1, unitPrice: 12.00 },
      { name: 'Rice', quantity: 1, unitPrice: 3.00 },
      { name: 'Mango Lassi', quantity: 1, unitPrice: 4.50 }
    ],
    totalAmount: 19.50,
    createdAt: '2024-01-15T15:00:00Z'
  },
  {
    id: 'order_005',
    orderType: 'take-away',
    status: 'Pending',
    customerInfo: { name: 'Michael Chen', phone: '+49 987 654 321' },
    items: [
      { name: 'Vegetable Biryani', quantity: 1, unitPrice: 11.00 },
      { name: 'Raita', quantity: 1, unitPrice: 2.50 },
      { name: 'Gulab Jamun', quantity: 2, unitPrice: 3.00 }
    ],
    totalAmount: 19.50,
    createdAt: '2024-01-15T15:30:00Z'
  },
  {
    id: 'order_006',
    orderType: 'take-away',
    status: 'Completed',
    customerInfo: { name: 'Emma Wilson', phone: '+49 555 123 456' },
    items: [
      { name: 'Butter Chicken', quantity: 1, unitPrice: 13.00 },
      { name: 'Garlic Naan', quantity: 2, unitPrice: 2.50 },
      { name: 'Coca Cola', quantity: 1, unitPrice: 2.50 }
    ],
    totalAmount: 20.50,
    createdAt: '2024-01-15T14:00:00Z',
    completedAt: '2024-01-15T14:45:00Z',
    paymentMode: 'cash',
    tipAmount: 2.00,
    amountPaid: 22.50
  }
];

// Helper function to find inventory item by name (case-insensitive)
function findInventoryItemByName(inventory: any[], searchName: string): any | null {
  return inventory.find(item => 
    item.name.toLowerCase() === searchName.toLowerCase() ||
    item.name.toLowerCase().includes(searchName.toLowerCase()) ||
    searchName.toLowerCase().includes(item.name.toLowerCase())
  ) || null;
}

// Helper function to convert units
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

// Helper type guard for IngredientQuantity
function isIngredientQuantity(obj: any): obj is { inventoryItemName: string; quantityPerDish: number; unit: string } {
  return (
    obj && typeof obj === 'object' &&
    typeof obj.inventoryItemName === 'string' &&
    typeof obj.quantityPerDish === 'number' &&
    typeof obj.unit === 'string'
  );
}

/**
 * Update inventory based on order items
 */
async function updateInventoryFromOrder(order: any, userId: string) {
  console.log('🔄 Updating inventory for order:', order.id);
  
  try {
    // Get current inventory
    const inventory = getInventory(userId);
    const menu = getDishes(userId);
    
    console.log('📊 Current inventory items:', inventory.length);
    console.log('🍽️ Available dishes:', menu.length);
    
    // Track inventory updates
    const inventoryUpdates: any[] = [];
    
    // Process each order item
    for (const orderItem of order.items) {
      const dishName = orderItem.name;
      const orderQuantity = orderItem.quantity;
      
      console.log(`🍽️ Processing dish: ${dishName} (quantity: ${orderQuantity})`);
      
      // Find the dish in menu
      const dish = menu.find(d => d.name.toLowerCase() === dishName.toLowerCase());
      
      if (!dish) {
        console.warn(`⚠️ Dish not found in menu: ${dishName}`);
        continue;
      }
      
      const ingredientCount = Array.isArray(dish.ingredients) ? dish.ingredients.length : 0;
      console.log(`📋 Dish found: ${dish.name} with ${ingredientCount} ingredients`);
      
      // Process each ingredient in the dish
      if (Array.isArray(dish.ingredients)) {
        for (const ingredient of dish.ingredients) {
          if (!isIngredientQuantity(ingredient)) {
            console.warn(`⚠️ Ingredient is not a structured object:`, ingredient);
            continue;
          }
          const ingredientName = ingredient.inventoryItemName;
          const quantityPerDish = ingredient.quantityPerDish;
          const unit = ingredient.unit;
          
          // Calculate total quantity needed for this order
          const totalQuantityNeeded = quantityPerDish * orderQuantity;
          
          console.log(`🥘 Ingredient: ${ingredientName} - ${quantityPerDish} ${unit} per dish × ${orderQuantity} dishes = ${totalQuantityNeeded} ${unit} total`);
          
          // Find inventory item
          const inventoryItem = inventory.find(item => 
            item.name.toLowerCase() === ingredientName.toLowerCase() ||
            item.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
            ingredientName.toLowerCase().includes(item.name.toLowerCase())
          );
          
          if (!inventoryItem) {
            console.warn(`⚠️ Inventory item not found: ${ingredientName}`);
            continue;
          }
          
          console.log(`📦 Inventory item found: ${inventoryItem.name} (current: ${inventoryItem.quantity} ${inventoryItem.unit})`);
          
          // Convert units if needed
          let convertedQuantity = totalQuantityNeeded;
          if (unit.toLowerCase() !== inventoryItem.unit.toLowerCase()) {
            convertedQuantity = convertUnits(totalQuantityNeeded, unit, inventoryItem.unit);
            console.log(`🔄 Unit conversion: ${totalQuantityNeeded} ${unit} = ${convertedQuantity} ${inventoryItem.unit}`);
          }
          
          // Check if enough stock
          if (inventoryItem.quantity < convertedQuantity) {
            console.warn(`⚠️ Insufficient stock for ${ingredientName}: available ${inventoryItem.quantity} ${inventoryItem.unit}, needed ${convertedQuantity} ${inventoryItem.unit}`);
            continue;
          }
          
          // Update inventory
          const oldQuantity = inventoryItem.quantity;
          inventoryItem.quantity -= convertedQuantity;
          inventoryItem.quantityUsed = (inventoryItem.quantityUsed || 0) + convertedQuantity;
          inventoryItem.totalUsed = (inventoryItem.totalUsed || 0) + convertedQuantity;
          
          console.log(`✅ Updated ${ingredientName}: ${oldQuantity} → ${inventoryItem.quantity} ${inventoryItem.unit} (used: +${convertedQuantity})`);
          
          inventoryUpdates.push({
            item: ingredientName,
            oldQuantity,
            newQuantity: inventoryItem.quantity,
            used: convertedQuantity,
            unit: inventoryItem.unit
          });
        }
      }
    }
    
    // Update inventory alerts
    updateInventoryAlerts(userId);
    const newAlerts: string[] = [];
    
    console.log(`✅ Inventory update completed: ${inventoryUpdates.length} items updated`);
    console.log(`🚨 New alerts generated: ${newAlerts.length}`);
    
    return {
      success: true,
      message: `Inventory updated successfully. ${inventoryUpdates.length} items modified.`,
      updates: inventoryUpdates,
      alerts: newAlerts
    };
    
  } catch (error) {
    console.error('❌ Error updating inventory:', error);
    return {
      success: false,
      message: 'Error updating inventory',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET() {
  return NextResponse.json({ orders });
}

export async function POST(request: NextRequest) {
  try {
    const order = await request.json();
    orders.push(order);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status, paymentMode, tipAmount, amountPaid, userId } = await request.json();
    const idx = orders.findIndex(order => order.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const order = orders[idx];
    order.status = status;
    
    if (status === 'Completed') {
      order.completedAt = new Date().toISOString();
      
      // Update inventory when order is completed
      await updateInventoryFromOrder(order, userId);
    }
    
    if (paymentMode) order.paymentMode = paymentMode;
    if (typeof tipAmount !== 'undefined') order.tipAmount = tipAmount;
    if (typeof amountPaid !== 'undefined') order.amountPaid = amountPaid;
    
    return NextResponse.json({ order: orders[idx] });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 