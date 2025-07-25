import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    // Mock purchase orders for demo
    const mockPurchaseOrders = [
      {
        id: 'po_1721234567890',
        orderNumber: 'PO-20250724-001',
        vendorName: 'Fresh Valley Farms',
        totalAmount: 425.00,
        status: status || 'draft',
        orderDate: '2025-07-24T10:00:00Z',
        items: [
          { itemName: 'Fresh Chicken', quantity: 50, unitPrice: 8.50 }
        ]
      },
      {
        id: 'po_1721234567891',
        orderNumber: 'PO-20250724-002',
        vendorName: 'Bavaria Premium Foods',
        totalAmount: 125.00,
        status: 'approved',
        orderDate: '2025-07-24T09:30:00Z',
        items: [
          { itemName: 'Garam Masala', quantity: 5, unitPrice: 25.00 }
        ]
      }
    ];
    
    const filteredOrders = status 
      ? mockPurchaseOrders.filter(order => order.status === status)
      : mockPurchaseOrders;
    
    return NextResponse.json({
      success: true,
      data: filteredOrders
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      itemId, 
      itemName, 
      quantity, 
      vendorId, 
      urgencyLevel, 
      estimatedCost,
      reason,
      scheduledDelivery,
      approvalId 
    } = body;
    
    if (!itemName || !quantity || !vendorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: itemName, quantity, vendorId' },
        { status: 400 }
      );
    }
    
    // Generate unique PO number
    const timestamp = Date.now();
    const poNumber = `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(timestamp).slice(-3)}`;
    
    // Vendor mapping for demo
    const vendorMap: { [key: string]: any } = {
      'v1': {
        id: 'v1',
        name: 'Fresh Valley Farms',
        contact: {
          name: 'Maria Schmidt',
          email: 'maria@freshvalley.de',
          phone: '+49-711-123456',
          address: 'Farm Road 15, Stuttgart, Germany',
          contactPerson: 'Maria Schmidt'
        }
      },
      'v2': {
        id: 'v2',
        name: 'Hechingen Local Market',
        contact: {
          name: 'Klaus Weber',
          email: 'klaus@hechingen-market.de',
          phone: '+49-7471-987654',
          address: 'Market Square 1, Hechingen, Germany',
          contactPerson: 'Klaus Weber'
        }
      },
      'v3': {
        id: 'v3',
        name: 'Bavaria Premium Foods',
        contact: {
          name: 'Anna Mueller',
          email: 'anna@bavaria-premium.de',
          phone: '+49-89-456789',
          address: 'Premium Street 25, Munich, Germany',
          contactPerson: 'Anna Mueller'
        }
      },
      'v4': {
        id: 'v4',
        name: 'Global Spice Trading',
        contact: {
          name: 'Raj Patel',
          email: 'raj@globalspice.de',
          phone: '+49-69-345678',
          address: 'Trade Center 50, Frankfurt, Germany',
          contactPerson: 'Raj Patel'
        }
      }
    };
    
    const vendor = vendorMap[vendorId];
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }
    
    // Calculate pricing based on item type
    const itemPricing: { [key: string]: number } = {
      'Fresh Chicken': 8.50,
      'Chicken Breast': 8.50,
      'Basmati Rice': 3.20,
      'Fresh Tomatoes': 2.80,
      'Olive Oil': 15.00,
      'Garam Masala': 25.00
    };
    
    const unitPrice = itemPricing[itemName] || estimatedCost / quantity || 10.00;
    const subtotal = quantity * unitPrice;
    const taxRate = 0.19; // 19% VAT in Germany
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    
    // Create purchase order
    const purchaseOrder = {
      id: `po_${timestamp}`,
      orderNumber: poNumber,
      quotationRequestId: `qr_${timestamp}`,
      quotationResponseId: `qr_${timestamp}_r1`,
      ownerApprovalId: approvalId || `ap_${timestamp}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorContact: vendor.contact,
      orderDate: new Date().toISOString(),
      requiredDeliveryDate: scheduledDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDeliveryDate: scheduledDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          itemId: itemId || itemName.toLowerCase().replace(/\s+/g, '-'),
          itemName,
          description: reason || `Procurement order for ${itemName}`,
          quantity,
          unit: 'kg',
          unitPrice,
          totalPrice: subtotal,
          specifications: 'Standard quality requirements'
        }
      ],
      subtotal,
      taxAmount,
      totalAmount,
      paymentTerms: 'Net 30',
      deliveryAddress: 'Museum Restaurant Hechingen, Kitchen Entrance, Hechingen, Germany',
      specialInstructions: urgencyLevel === 'critical' ? 'URGENT - Priority delivery required' : 'Standard delivery to kitchen entrance',
      status: 'draft',
      createdBy: 'supply_sync_bot',
      approvedBy: 'system'
    };
    
    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: `Purchase order ${poNumber} created successfully`
    });
  } catch (error) {
    console.error('Error generating purchase order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate purchase order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, action, trackingInfo } = body;
    
    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'send':
        result = {
          id: orderId,
          status: 'sent',
          sentDate: new Date().toISOString(),
          message: 'Purchase order sent to vendor successfully'
        };
        break;
      case 'confirm':
        result = {
          id: orderId,
          status: 'confirmed',
          confirmedDate: new Date().toISOString(),
          message: 'Purchase order confirmed by vendor'
        };
        break;
      case 'update_tracking':
        if (!trackingInfo) {
          return NextResponse.json(
            { success: false, error: 'Tracking info is required' },
            { status: 400 }
          );
        }
        result = {
          id: orderId,
          status: 'in_transit',
          trackingNumber: trackingInfo.trackingNumber || `TRK-${Date.now()}`,
          carrier: trackingInfo.carrier || 'Standard Delivery',
          estimatedDelivery: trackingInfo.estimatedDelivery || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Tracking information updated successfully'
        };
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update purchase order' },
      { status: 500 }
    );
  }
}
