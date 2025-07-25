import { NextRequest, NextResponse } from 'next/server';
import { getPendingOrders, getOrders, Order } from '@/lib/orderService';
import { getServerSideOrders } from '@/lib/serverOrderService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const orderType = searchParams.get('type') || 'pending'; // 'pending', 'all', 'completed'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('[Payment Orders API] Fetching orders for user:', userId, 'type:', orderType);

    // Get orders from server-side (file system) - this is where Voice AI orders are stored
    let serverSideOrders: Order[] = [];
    try {
      serverSideOrders = getServerSideOrders(userId);
      console.log('[Payment Orders API] Server-side orders:', serverSideOrders.length);
      
      // Filter server-side orders by type
      if (orderType === 'pending') {
        serverSideOrders = serverSideOrders.filter(order => order.status === 'Pending Payment');
      } else if (orderType === 'completed') {
        serverSideOrders = serverSideOrders.filter(order => order.status === 'Completed');
      }
    } catch (error) {
      console.error('[Payment Orders API] Error getting server-side orders:', error);
    }

    // Try to get client-side orders as well (for backwards compatibility)
    let clientSideOrders: Order[] = [];
    try {
      // This will only work in browser environment, returns empty array on server
      if (typeof window !== 'undefined') {
        if (orderType === 'pending') {
          clientSideOrders = getPendingOrders(userId);
        } else {
          clientSideOrders = getOrders(userId);
          if (orderType === 'pending') {
            clientSideOrders = clientSideOrders.filter(order => order.status === 'Pending Payment');
          } else if (orderType === 'completed') {
            clientSideOrders = clientSideOrders.filter(order => order.status === 'Completed');
          }
        }
      }
      console.log('[Payment Orders API] Client-side orders:', clientSideOrders.length);
    } catch (error) {
      console.log('[Payment Orders API] Client-side orders not available (server environment)');
    }

    // Combine orders from both sources, avoiding duplicates by ID
    const allOrders = [...serverSideOrders];
    clientSideOrders.forEach(clientOrder => {
      if (!allOrders.some(order => order.id === clientOrder.id)) {
        allOrders.push(clientOrder);
      }
    });

    // Sort by creation date (newest first)
    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log('[Payment Orders API] Total combined orders:', allOrders.length);
    
    // Log order details for debugging
    if (allOrders.length > 0) {
      console.log('[Payment Orders API] Sample orders:', allOrders.slice(0, 3).map(order => ({
        id: order.id,
        table: order.table,
        status: order.status,
        items: order.items.length,
        total: order.totalAmount
      })));
    }

    return NextResponse.json({
      success: true,
      orders: allOrders,
      sources: {
        clientSide: clientSideOrders.length,
        serverSide: serverSideOrders.length,
        total: allOrders.length
      }
    });

  } catch (error) {
    console.error('[Payment Orders API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
