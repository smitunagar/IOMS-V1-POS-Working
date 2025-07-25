/**
 * 📝 Order Management API - Real-time order processing from AI agent
 */

import { NextRequest, NextResponse } from 'next/server';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerInfo: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  source: 'phone' | 'web' | 'walk-in' | 'ai-agent';
  sessionId?: string; // For AI agent orders
  createdAt: Date;
  estimatedTime?: number; // in minutes
  specialInstructions?: string;
}

// In-memory storage for orders
const orders: Map<string, Order> = new Map();
let orderCounter = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return handleCreateOrder(body);
      case 'update-status':
        return handleUpdateOrderStatus(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in order management API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function handleCreateOrder(body: any) {
  const { orderData, sessionId } = body;
  
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Order data and items are required' },
      { status: 400 }
    );
  }

  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const orderNumber = `#${orderCounter++}`;
  
  // Calculate totals
  const subtotal = orderData.items.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.price), 0
  );
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  // Estimate preparation time based on items
  const estimatedTime = Math.max(15, orderData.items.length * 5 + Math.floor(Math.random() * 10));

  const order: Order = {
    id: orderId,
    orderNumber,
    customerInfo: orderData.customerInfo || {},
    items: orderData.items.map((item: any, index: number) => ({
      id: `item_${Date.now()}_${index}`,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes
    })),
    subtotal,
    tax,
    total,
    orderType: orderData.orderType || 'dine-in',
    status: 'confirmed',
    source: sessionId ? 'ai-agent' : 'web',
    sessionId,
    createdAt: new Date(),
    estimatedTime,
    specialInstructions: orderData.specialInstructions
  };

  orders.set(orderId, order);

  // Log the order creation
  console.log(`🍽️ New Order Created: ${orderNumber}`, {
    total: `$${total.toFixed(2)}`,
    items: order.items.length,
    type: order.orderType,
    source: order.source
  });

  return NextResponse.json({
    success: true,
    order,
    message: `Order ${orderNumber} created successfully`
  });
}

function handleUpdateOrderStatus(body: any) {
  const { orderId, status, estimatedTime } = body;
  
  const order = orders.get(orderId);
  if (!order) {
    return NextResponse.json(
      { success: false, error: 'Order not found' },
      { status: 404 }
    );
  }

  order.status = status;
  if (estimatedTime !== undefined) {
    order.estimatedTime = estimatedTime;
  }

  orders.set(orderId, order);

  console.log(`📋 Order Status Updated: ${order.orderNumber} -> ${status}`);

  return NextResponse.json({
    success: true,
    order,
    message: `Order status updated to ${status}`
  });
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');
    const status = url.searchParams.get('status');
    const source = url.searchParams.get('source');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (orderId) {
      const order = orders.get(orderId);
      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        order
      });
    }

    // Filter orders
    let filteredOrders = Array.from(orders.values());
    
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    if (source) {
      filteredOrders = filteredOrders.filter(order => order.source === source);
    }

    // Sort by creation date (newest first) and limit
    filteredOrders = filteredOrders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    // Calculate statistics
    const stats = {
      total: orders.size,
      pending: Array.from(orders.values()).filter(o => o.status === 'pending').length,
      confirmed: Array.from(orders.values()).filter(o => o.status === 'confirmed').length,
      preparing: Array.from(orders.values()).filter(o => o.status === 'preparing').length,
      ready: Array.from(orders.values()).filter(o => o.status === 'ready').length,
      completed: Array.from(orders.values()).filter(o => o.status === 'completed').length,
      todayTotal: Array.from(orders.values()).filter(o => 
        o.createdAt.toDateString() === new Date().toDateString()
      ).reduce((sum, o) => sum + o.total, 0)
    };

    return NextResponse.json({
      success: true,
      orders: filteredOrders,
      stats,
      total: filteredOrders.length
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, updates } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = orders.get(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (updates.status) order.status = updates.status;
    if (updates.estimatedTime !== undefined) order.estimatedTime = updates.estimatedTime;
    if (updates.specialInstructions !== undefined) order.specialInstructions = updates.specialInstructions;
    if (updates.customerInfo) order.customerInfo = { ...order.customerInfo, ...updates.customerInfo };

    orders.set(orderId, order);

    return NextResponse.json({
      success: true,
      order,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = orders.get(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation of pending/confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel order in current status' },
        { status: 400 }
      );
    }

    order.status = 'cancelled';
    orders.set(orderId, order);

    console.log(`❌ Order Cancelled: ${order.orderNumber}`);

    return NextResponse.json({
      success: true,
      order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
