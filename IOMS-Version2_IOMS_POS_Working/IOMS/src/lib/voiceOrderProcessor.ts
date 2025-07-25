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

interface ProcessOrderRequest {
  userId: string;
  customerName: string;
  items: VoiceOrderItem[];
  orderType: 'dine-in' | 'delivery';
  tableId?: string;
  customerPhone?: string;
  customerAddress?: string;
}

export async function processVoiceOrder(request: ProcessOrderRequest) {
  try {
    const { userId, customerName, items, orderType, tableId, customerPhone, customerAddress } = request;

    if (!userId || !items || items.length === 0) {
      return { 
        success: false,
        error: 'User ID and order items are required' 
      };
    }

    if (orderType === 'dine-in' && !tableId) {
      return { 
        success: false,
        error: 'Table ID is required for dine-in orders' 
      };
    }

    if (orderType === 'delivery' && (!customerPhone || !customerAddress)) {
      return { 
        success: false,
        error: 'Customer phone and address are required for delivery orders' 
      };
    }

    console.log('[Voice Order Processor] Processing order for user:', userId);
    console.log('[Voice Order Processor] Items:', items);

    // Get the real menu - try client-side first, then server-side
    let menuDishes = getDishes(userId);
    
    // If client-side returns empty (server environment), use server-side menu service
    if (menuDishes.length === 0) {
      console.log('[Voice Order Processor] Client-side menu empty, using server-side menu');
      menuDishes = getServerSideDishes(userId);
    }
    
    console.log('[Voice Order Processor] Found', menuDishes.length, 'dishes for user');
    
    // If still no dishes found for this user, try the default user
    if (menuDishes.length === 0) {
      console.log('[Voice Order Processor] No dishes for user, trying DEFAULT_USER_ID');
      const defaultUserId = process.env.DEFAULT_USER_ID || 'user_1752538556589_u705p8e0q';
      menuDishes = getDishes(defaultUserId);
      
      // Try server-side for default user too
      if (menuDishes.length === 0) {
        menuDishes = getServerSideDishes(defaultUserId);
      }
      
      console.log('[Voice Order Processor] Default user dishes:', menuDishes.length, 'items');
    }

    if (menuDishes.length === 0) {
      return { 
        success: false,
        error: 'No menu items found. Please set up your menu first.',
        debug: {
          requestedUserId: userId,
          defaultUserId: process.env.DEFAULT_USER_ID || 'user_1752538556589_u705p8e0q'
        }
      };
    }

    // Match voice order items to menu items
    const matchedOrderItems: OrderItem[] = [];
    const unmatchedItems: string[] = [];
    let subtotal = 0;

    console.log('[Voice Order Processor] Available menu items:', menuDishes.map(d => d.name));

    for (const voiceItem of items) {
      console.log(`[Voice Order Processor] Trying to match: "${voiceItem.itemName}"`);
      
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
        
        console.log(`[Voice Order Processor] Matched "${voiceItem.itemName}" to "${menuItem.name}" - $${price} x ${voiceItem.quantity}`);
      } else {
        unmatchedItems.push(voiceItem.itemName);
        console.log(`[Voice Order Processor] Could not match "${voiceItem.itemName}" to any menu item`);
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

      return { 
        success: false,
        error: errorMessage,
        unmatchedItems,
        suggestions: suggestions.length > 0 ? suggestions : menuDishes.slice(0, 5).map(dish => ({ name: dish.name, price: dish.price }))
      };
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
      console.log('[Voice Order Processor] Client-side order creation failed, using server-side');
      newOrder = addServerSideOrder(userId, orderData);
    }

    if (!newOrder) {
      return { 
        success: false,
        error: 'Failed to create order' 
      };
    }

    // For dine-in orders, mark the table as occupied
    if (orderType === 'dine-in' && tableId) {
      // Try client-side first, then server-side
      try {
        setOccupiedTable(userId, tableId, newOrder.id);
      } catch (error) {
        console.log('[Voice Order Processor] Client-side table marking failed, using server-side');
        setServerSideOccupiedTable(userId, tableId, newOrder.id);
      }
      console.log(`[Voice Order Processor] Table ${tableId} marked as occupied by order ${newOrder.id}`);
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

    console.log('[Voice Order Processor] Order created successfully:', newOrder.id);

    return response;

  } catch (error) {
    console.error('[Voice Order Processor] Error:', error);
    return {
      success: false,
      error: 'Failed to create order'
    };
  }
}
