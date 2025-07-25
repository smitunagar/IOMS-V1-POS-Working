const express = require('express');
const { orders, menuItems, inventory } = require('../data/mockData');

const router = express.Router();

/**
 * POST /api/orders
 * Accept an order with table number and list of item IDs & quantities
 * Validate against current inventory and menu availability
 */
router.post('/', async (req, res) => {
  try {
    const { tableNumber, items, customerName, specialInstructions } = req.body;
    
    // Basic validation
    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Table number and items array are required'
      });
    }
    
    // Validate each item in the order
    const orderItems = [];
    let totalAmount = 0;
    
    for (const orderItem of items) {
      const { itemId, quantity } = orderItem;
      
      if (!itemId || !quantity || quantity <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Each item must have a valid itemId and positive quantity'
        });
      }
      
      // Check if menu item exists and is available
      const menuItem = menuItems.find(item => item.id === itemId);
      if (!menuItem) {
        return res.status(404).json({
          status: 'error',
          message: `Menu item with ID ${itemId} not found`
        });
      }
      
      if (!menuItem.availability) {
        return res.status(400).json({
          status: 'error',
          message: `Menu item "${menuItem.name}" is currently unavailable`
        });
      }
      
      // Calculate item total
      const itemTotal = menuItem.price * quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        itemId,
        itemName: menuItem.name,
        quantity,
        unitPrice: menuItem.price,
        totalPrice: itemTotal
      });
    }
    
    // Create new order
    const newOrder = {
      id: `O${String(orders.length + 1).padStart(3, '0')}`,
      tableNumber,
      customerName: customerName || null,
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
      status: 'pending',
      orderTime: new Date().toISOString(),
      estimatedReadyTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(), // 20 minutes from now
      specialInstructions: specialInstructions || null
    };
    
    orders.push(newOrder);
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order',
      error: error.message
    });
  }
});

/**
 * GET /api/orders
 * Get all orders with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { status, tableNumber, date } = req.query;
    
    let filteredOrders = [...orders];
    
    // Filter by status
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    // Filter by table number
    if (tableNumber) {
      filteredOrders = filteredOrders.filter(order => 
        order.tableNumber === parseInt(tableNumber)
      );
    }
    
    // Filter by date (if provided)
    if (date) {
      const filterDate = new Date(date).toDateString();
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.orderTime).toDateString() === filterDate
      );
    }
    
    // Sort by order time (newest first)
    filteredOrders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
    
    res.status(200).json({
      status: 'success',
      message: 'Orders retrieved successfully',
      data: {
        orders: filteredOrders,
        total: filteredOrders.length,
        summary: {
          pending: filteredOrders.filter(o => o.status === 'pending').length,
          preparing: filteredOrders.filter(o => o.status === 'preparing').length,
          ready: filteredOrders.filter(o => o.status === 'ready').length,
          completed: filteredOrders.filter(o => o.status === 'completed').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve orders',
      error: error.message
    });
  }
});

/**
 * GET /api/orders/:orderId
 * Get a specific order by ID
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Order retrieved successfully',
      data: order,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve order',
      error: error.message
    });
  }
});

/**
 * PATCH /api/orders/:orderId
 * Update order status
 */
router.patch('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }
    
    orders[orderIndex].status = status;
    orders[orderIndex].lastUpdated = new Date().toISOString();
    
    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: orders[orderIndex],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order',
      error: error.message
    });
  }
});

module.exports = router;
