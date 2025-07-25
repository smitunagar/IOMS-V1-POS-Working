import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, clearOccupiedTable } from '@/lib/orderService';
import { updateServerSideOrderStatus } from '@/lib/serverOrderService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, orderId, status, action } = body;

    if (!userId || !orderId || !status) {
      return NextResponse.json({ 
        error: 'User ID, order ID, and status are required' 
      }, { status: 400 });
    }

    console.log('[Payment API] Updating order:', orderId, 'to status:', status, 'for user:', userId);

    // Try to update order status in both storage systems
    let updatedOrder = null;
    
    // Try client-side first (localStorage)
    try {
      updatedOrder = updateOrderStatus(userId, orderId, status);
      if (updatedOrder) {
        console.log('[Payment API] Updated order in client-side storage');
      }
    } catch (error) {
      console.log('[Payment API] Client-side update not available (server environment)');
    }

    // Try server-side (file system)
    if (!updatedOrder) {
      try {
        updatedOrder = updateServerSideOrderStatus(userId, orderId, status);
        if (updatedOrder) {
          console.log('[Payment API] Updated order in server-side storage');
        }
      } catch (error) {
        console.error('[Payment API] Server-side update failed:', error);
      }
    }

    if (!updatedOrder) {
      return NextResponse.json({ 
        error: 'Failed to update order status - order not found' 
      }, { status: 404 });
    }

    // Handle table clearing for completed dine-in orders
    if (status === 'Completed' && updatedOrder.orderType === 'dine-in' && updatedOrder.tableId) {
      try {
        clearOccupiedTable(userId, updatedOrder.tableId);
        console.log('[Payment API] Table cleared:', updatedOrder.tableId);
      } catch (error) {
        console.log('[Payment API] Could not clear table (client-side only)');
        // Note: We don't have a server-side table clearing function yet, but the order is still marked as completed
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Order ${orderId} updated to ${status}`
    });

  } catch (error) {
    console.error('[Payment API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
