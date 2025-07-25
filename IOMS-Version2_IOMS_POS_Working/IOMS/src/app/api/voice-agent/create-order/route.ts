import { NextRequest, NextResponse } from 'next/server';
import { addOrder, OrderItem, NewOrderData } from '@/lib/orderService';
import { addServerSideOrder, setServerSideOccupiedTable } from '@/lib/serverOrderService';
import { getDishes } from '@/lib/menuService';
import { getServerSideDishes } from '@/lib/serverMenuService';
import { setOccupiedTable } from '@/lib/orderService';

interface VoiceOrderItem {
  itemName: string;
  quantity: number;
  specialInstructions: string;
}

interface VoiceOrderRequest {
  userId: string;
  customerName: string;
  items: VoiceOrderItem[];
  orderType: 'dine-in' | 'delivery';
  tableId?: string;
  customerPhone?: string;
  customerAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VoiceOrderRequest = await request.json();
    const { userId, customerName, items, orderType, tableId, customerPhone, customerAddress } = body;

    if (!userId || !items || items.length === 0) {
      return NextResponse.json({ 
        error: 'User ID and order items are required' 
      }, { status: 400 });
    }

    if (orderType === 'dine-in' && !tableId) {
      return NextResponse.json({ 
        error: 'Table ID is required for dine-in orders' 
      }, { status: 400 });
    }

    if (orderType === 'delivery' && (!customerPhone || !customerAddress)) {
      return NextResponse.json({ 
        error: 'Customer phone and address are required for delivery orders' 
      }, { status: 400 });
    }

    console.log('[Voice Agent Create Order] Processing order for user:', userId);
    console.log('[Voice Agent Create Order] Raw request body:', JSON.stringify(body, null, 2));
    console.log('[Voice Agent Create Order] Items received:', JSON.stringify(items, null, 2));
    
    // DETAILED LOGGING: Check each raw item before processing
    items.forEach((item, index) => {
      console.log(`[Voice Agent Create Order] RAW ITEM ${index + 1}:`, {
        itemName: item.itemName,
        quantity: item.quantity,
        quantityType: typeof item.quantity,
        specialInstructions: item.specialInstructions
      });
    });
    
    // IMMEDIATE DEDUPLICATION: Consolidate items with same name before any processing
    const consolidatedItems: VoiceOrderItem[] = [];
    const itemMap = new Map<string, number>();
    
    items.forEach(item => {
      const normalizedName = item.itemName.toLowerCase().trim();
      const currentQuantity = itemMap.get(normalizedName) || 0;
      const itemQuantity = item.quantity || 1;
      
      console.log(`[Voice Agent Create Order] Processing item: "${item.itemName}" - Adding quantity ${itemQuantity} to existing ${currentQuantity}`);
      itemMap.set(normalizedName, currentQuantity + itemQuantity);
    });
    
    console.log('[Voice Agent Create Order] ITEM MAP after consolidation:', Array.from(itemMap.entries()));
    
    for (const [itemName, totalQuantity] of itemMap) {
      // Find original item to preserve casing and instructions
      const originalItem = items.find(item => item.itemName.toLowerCase().trim() === itemName);
      consolidatedItems.push({
        itemName: originalItem?.itemName || itemName,
        quantity: totalQuantity,
        specialInstructions: originalItem?.specialInstructions || ''
      });
    }
    
    console.log('[Voice Agent Create Order] CONSOLIDATED ITEMS:', JSON.stringify(consolidatedItems, null, 2));
    
    // Debug: Check each consolidated item's quantity
    consolidatedItems.forEach((item, index) => {
      console.log(`[Voice Agent Create Order] Consolidated Item ${index + 1}: "${item.itemName}" - Quantity: ${item.quantity} (type: ${typeof item.quantity})`);
      
      // Ensure quantity is a valid positive number
      if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
        console.warn(`[Voice Agent Create Order] Invalid quantity for "${item.itemName}": ${item.quantity}, defaulting to 1`);
        item.quantity = 1;
      }
      
      // Cap quantity at reasonable limit to prevent accidental large orders
      if (item.quantity > 10) {
        console.warn(`[Voice Agent Create Order] Quantity too high for "${item.itemName}": ${item.quantity}, capping at 10`);
        item.quantity = 10;
      }
    });

    // Use consolidated items for all further processing
    const processedItems = consolidatedItems;

    // Get the real menu - try client-side first, then server-side
    let menuDishes = getDishes(userId);
    
    // If client-side returns empty (server environment), use server-side menu service
    if (menuDishes.length === 0) {
      console.log('[Voice Agent Create Order] Client-side menu empty, using server-side menu');
      menuDishes = getServerSideDishes(userId);
    }
    
    console.log('[Voice Agent Create Order] Found', menuDishes.length, 'dishes for user');
    
    // If still no dishes found for this user, try the default user
    if (menuDishes.length === 0) {
      console.log('[Voice Agent Create Order] No dishes for user, trying DEFAULT_USER_ID');
      const defaultUserId = process.env.DEFAULT_USER_ID || 'user_1752538556589_u705p8e0q';
      menuDishes = getDishes(defaultUserId);
      
      // Try server-side for default user too
      if (menuDishes.length === 0) {
        menuDishes = getServerSideDishes(defaultUserId);
      }
      
      console.log('[Voice Agent Create Order] Default user dishes:', menuDishes.length, 'items');
    }

    if (menuDishes.length === 0) {
      return NextResponse.json({ 
        error: 'No menu items found. Please set up your menu first.',
        debug: {
          requestedUserId: userId,
          defaultUserId: process.env.DEFAULT_USER_ID || 'user_1752538556589_u705p8e0q'
        }
      }, { status: 400 });
    }

    // Match voice order items to menu items
    const matchedOrderItems: OrderItem[] = [];
    const unmatchedItems: string[] = [];
    let subtotal = 0;

    console.log('[Voice Agent Create Order] Available menu items:', menuDishes.map(d => d.name));

    for (const voiceItem of processedItems) {
      console.log(`[Voice Agent Create Order] Trying to match: "${voiceItem.itemName}" (quantity: ${voiceItem.quantity})`);
      
      // Find matching menu item with improved matching logic
      let menuItem = menuDishes.find(dish => {
        const dishName = dish.name.toLowerCase();
        const itemName = voiceItem.itemName.toLowerCase();
        
        // Exact match
        if (dishName === itemName) return true;
        
        // Partial match in either direction
        if (dishName.includes(itemName) || itemName.includes(dishName)) return true;
        
        // Word-by-word matching
        const dishWords = dishName.split(/\s+/);
        const itemWords = itemName.split(/\s+/);
        
        // Check if any significant words match
        for (const itemWord of itemWords) {
          if (itemWord.length > 2) {
            for (const dishWord of dishWords) {
              if (dishWord.includes(itemWord) || itemWord.includes(dishWord)) {
                return true;
              }
            }
          }
        }
        
        return false;
      });

      if (menuItem) {
        // Handle price conversion safely
        let price = 0;
        if (typeof menuItem.price === 'number') {
          price = menuItem.price;
        } else if (menuItem.price) {
          const priceStr = String(menuItem.price);
          price = parseFloat(priceStr.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        }

        const totalPrice = price * voiceItem.quantity;

        matchedOrderItems.push({
          dishId: menuItem.id || `dish-${Date.now()}`,
          name: menuItem.name,
          quantity: voiceItem.quantity,
          unitPrice: price,
          totalPrice
        });

        subtotal += totalPrice;
        
        console.log(`[Voice Agent Create Order] Matched "${voiceItem.itemName}" to "${menuItem.name}" - $${price} x ${voiceItem.quantity}`);
      } else {
        unmatchedItems.push(voiceItem.itemName);
        console.log(`[Voice Agent Create Order] Could not match "${voiceItem.itemName}" to any menu item`);
      }
    }

    if (matchedOrderItems.length === 0) {
      // Find similar items for better suggestions
      const suggestions: { name: string; price: number }[] = [];
      for (const unmatchedItem of unmatchedItems) {
        const itemWords = unmatchedItem.toLowerCase().split(/\s+/);
        for (const word of itemWords) {
          if (word.length > 3) {
            const similarItems = menuDishes.filter(dish => 
              dish.name.toLowerCase().includes(word)
            ).slice(0, 3);
            
            similarItems.forEach(dish => {
              if (!suggestions.some(s => s.name === dish.name)) {
                suggestions.push({ name: dish.name, price: dish.price });
              }
            });
          }
        }
      }

      const errorMessage = suggestions.length > 0 
        ? `I couldn't find "${unmatchedItems.join(', ')}" in our menu. Did you mean: ${suggestions.map(s => s.name).join(', ')}?`
        : `I couldn't find "${unmatchedItems.join(', ')}" in our menu. Here are some available items: ${menuDishes.slice(0, 5).map(dish => dish.name).join(', ')}`;

      return NextResponse.json({ 
        error: errorMessage,
        unmatchedItems,
        suggestions: suggestions.length > 0 ? suggestions : menuDishes.slice(0, 5).map(dish => ({ name: dish.name, price: dish.price }))
      }, { status: 400 });
    }

    // Create the order data
    const orderData: NewOrderData = {
      orderType,
      items: matchedOrderItems,
      subtotal,
      taxRate: 0.1,
      table: orderType === 'dine-in' ? `Table ${tableId}` : `Delivery to ${customerName}`,
      tableId: orderType === 'dine-in' ? tableId! : `delivery-${Date.now()}`,
      customerName,
      customerPhone: orderType === 'delivery' ? customerPhone : undefined,
      customerAddress: orderType === 'delivery' ? customerAddress : undefined
    };

    // Create the order - try client-side first, then server-side
    let newOrder = addOrder(userId, orderData);
    
    // If client-side fails (server environment), use server-side order service
    if (!newOrder) {
      console.log('[Voice Agent Create Order] Client-side order creation failed, using server-side');
      newOrder = addServerSideOrder(userId, orderData);
    }

    if (!newOrder) {
      return NextResponse.json({ 
        error: 'Failed to create order' 
      }, { status: 500 });
    }

    // For dine-in orders, mark the table as occupied
    if (orderType === 'dine-in' && tableId) {
      // Try client-side first, then server-side
      try {
        setOccupiedTable(userId, tableId, newOrder.id);
      } catch (error) {
        console.log('[Voice Agent Create Order] Client-side table marking failed, using server-side');
        setServerSideOccupiedTable(userId, tableId, newOrder.id);
      }
      console.log(`[Voice Agent Create Order] Table ${tableId} marked as occupied by order ${newOrder.id}`);
    }

    // Prepare response
    const response = {
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.id.substring(0, 8),
      message: `Order created successfully for ${customerName || 'customer'}`,
      orderDetails: {
        orderId: newOrder.id,
        orderType: newOrder.orderType,
        customerName: newOrder.customerName,
        table: newOrder.table,
        items: matchedOrderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        subtotal: newOrder.subtotal,
        taxAmount: newOrder.taxAmount,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status
      },
      matchedItems: matchedOrderItems.length,
      unmatchedItems: unmatchedItems.length > 0 ? unmatchedItems : undefined
    };

    console.log('[Voice Agent Create Order] Order created successfully:', newOrder.id);

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Voice Agent Create Order] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
