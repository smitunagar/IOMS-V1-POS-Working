/**
 * 🍽️ Voice AI Agent - Order Processing API
 * Handles order creation from voice calls
 */

import { NextRequest, NextResponse } from 'next/server';

interface OrderItem {
  name: string;
  quantity: number;
  specialInstructions?: string;
  price?: number;
}

interface OrderRequest {
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  order_type: 'dine-in' | 'takeout' | 'delivery';
  delivery_address?: string;
  preferred_time?: string;
  source: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Voice Agent - Processing order request...');
    
    const data: OrderRequest = await request.json();
    
    // Validate required fields
    if (!data.customer_name || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, items' },
        { status: 400 }
      );
    }

    // Generate order ID
    const order_id = `VOICE-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate total (using basic pricing)
    const itemPrices: Record<string, number> = {
      'pizza': 15.99,
      'burger': 12.99,
      'pasta': 14.99,
      'salad': 10.99,
      'sandwich': 9.99,
      'soup': 7.99,
      'steak': 24.99,
      'chicken': 18.99,
      'fish': 22.99,
      'seafood': 26.99,
      'appetizer': 8.99,
      'dessert': 6.99,
      'drink': 3.99,
      'coffee': 4.99,
      'tea': 3.99
    };

    let total = 0;
    const processedItems = data.items.map(item => {
      const basePrice = itemPrices[item.name.toLowerCase()] || 10.99;
      const itemTotal = basePrice * item.quantity;
      total += itemTotal;
      
      return {
        ...item,
        price: basePrice,
        total: itemTotal
      };
    });

    // Create order object
    const order = {
      order_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone || 'Voice Call',
      customer_email: `voice-order-${order_id}@temp.com`,
      items: processedItems,
      order_type: data.order_type || 'dine-in',
      delivery_address: data.delivery_address,
      preferred_time: data.preferred_time,
      total_amount: total,
      status: data.status || 'confirmed',
      source: 'voice-ai-agent',
      created_at: new Date().toISOString(),
      estimated_ready_time: calculateReadyTime(data.order_type, data.items.length)
    };

    console.log('🎯 Creating voice order:', order);

    // Store in localStorage (simulating database)
    const storageKey = 'voice_orders';
    
    // Get existing orders
    let existingOrders = [];
    try {
      const stored = localStorage?.getItem(storageKey);
      if (stored) {
        existingOrders = JSON.parse(stored);
      }
    } catch (e) {
      console.log('No existing orders in localStorage');
    }

    // Add new order
    existingOrders.push(order);
    
    // Save back to localStorage
    try {
      localStorage?.setItem(storageKey, JSON.stringify(existingOrders));
    } catch (e) {
      console.log('Could not save to localStorage');
    }

    // Also store in session for immediate access
    try {
      sessionStorage?.setItem(`order_${order_id}`, JSON.stringify(order));
    } catch (e) {
      console.log('Could not save to sessionStorage');
    }

    // Broadcast event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('newVoiceOrder', { 
        detail: order 
      }));
    }

    console.log('✅ Voice order created successfully:', order_id);

    return NextResponse.json({
      success: true,
      order_id,
      order,
      message: `Order confirmed for ${data.customer_name}. Total: $${total.toFixed(2)}`
    });

  } catch (error) {
    console.error('❌ Error creating voice order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate estimated ready time
function calculateReadyTime(orderType: string, itemCount: number): string {
  const now = new Date();
  let minutes = 15; // Base time
  
  // Add time based on order type
  if (orderType === 'dine-in') {
    minutes += 5;
  } else if (orderType === 'delivery') {
    minutes += 25;
  }
  
  // Add time based on item count
  minutes += Math.max(0, (itemCount - 1) * 3);
  
  const readyTime = new Date(now.getTime() + minutes * 60000);
  return readyTime.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      // Get specific order
      const storageKey = 'voice_orders';
      const stored = localStorage?.getItem(storageKey);
      
      if (stored) {
        const orders = JSON.parse(stored);
        const order = orders.find((o: any) => o.order_id === orderId);
        
        if (order) {
          return NextResponse.json({ order });
        } else {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
      }
    } else {
      // Get all voice orders
      const storageKey = 'voice_orders';
      const stored = localStorage?.getItem(storageKey);
      const orders = stored ? JSON.parse(stored) : [];
      
      return NextResponse.json({ 
        orders,
        count: orders.length 
      });
    }

  } catch (error) {
    console.error('❌ Error fetching voice orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
