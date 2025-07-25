const express = require('express');
const { inventory } = require('../data/mockData');

const router = express.Router();

/**
 * GET /api/inventory
 * Return current stock for each item
 */
router.get('/', async (req, res) => {
  try {
    const { lowStock, itemName } = req.query;
    
    let filteredInventory = [...inventory];
    
    // Filter by low stock items
    if (lowStock === 'true') {
      filteredInventory = filteredInventory.filter(item => 
        item.currentStock <= item.minimumThreshold
      );
    }
    
    // Filter by item name (partial match)
    if (itemName) {
      filteredInventory = filteredInventory.filter(item =>
        item.itemName.toLowerCase().includes(itemName.toLowerCase())
      );
    }
    
    // Calculate inventory summary
    const summary = {
      totalItems: inventory.length,
      lowStockItems: inventory.filter(item => item.currentStock <= item.minimumThreshold).length,
      outOfStockItems: inventory.filter(item => item.currentStock === 0).length,
      totalValue: inventory.reduce((sum, item) => sum + (item.currentStock * (item.unitPrice || 0)), 0)
    };
    
    res.status(200).json(filteredInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve inventory',
      error: error.message
    });
  }
});

/**
 * GET /api/inventory/:itemId
 * Get specific inventory item
 */
router.get('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = inventory.find(i => i.id === itemId);
    
    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: 'Inventory item not found'
      });
    }
    
    // Add stock status
    const itemWithStatus = {
      ...item,
      stockStatus: item.currentStock === 0 ? 'out-of-stock' : 
                   item.currentStock <= item.minimumThreshold ? 'low-stock' : 'in-stock'
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Inventory item retrieved successfully',
      data: itemWithStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve inventory item',
      error: error.message
    });
  }
});

/**
 * PATCH /api/inventory/:itemId
 * Update quantity of a specific inventory item
 */
router.patch('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { currentStock, minimumThreshold, operation, quantity } = req.body;
    
    const itemIndex = inventory.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Inventory item not found'
      });
    }
    
    const item = inventory[itemIndex];
    
    // Handle different types of updates
    if (operation && quantity !== undefined) {
      // Perform add/subtract operations
      if (operation === 'add') {
        item.currentStock += quantity;
      } else if (operation === 'subtract') {
        item.currentStock = Math.max(0, item.currentStock - quantity);
      } else {
        return res.status(400).json({
          status: 'error',
          message: 'Operation must be "add" or "subtract"'
        });
      }
    } else if (currentStock !== undefined) {
      // Direct stock update
      if (currentStock < 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Stock quantity cannot be negative'
        });
      }
      item.currentStock = currentStock;
    }
    
    // Update minimum threshold if provided
    if (minimumThreshold !== undefined) {
      if (minimumThreshold < 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Minimum threshold cannot be negative'
        });
      }
      item.minimumThreshold = minimumThreshold;
    }
    
    // Update last modified timestamp
    item.lastUpdated = new Date().toISOString();
    
    // Determine stock status
    const stockStatus = item.currentStock === 0 ? 'out-of-stock' : 
                       item.currentStock <= item.minimumThreshold ? 'low-stock' : 'in-stock';
    
    const updatedItem = {
      ...item,
      stockStatus
    };
    
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update inventory',
      error: error.message
    });
  }
});

/**
 * POST /api/inventory
 * Add new inventory item
 */
router.post('/', async (req, res) => {
  try {
    const { 
      itemName, 
      currentStock, 
      unit, 
      minimumThreshold, 
      supplier, 
      unitPrice 
    } = req.body;
    
    // Basic validation
    if (!itemName || currentStock === undefined || !unit) {
      return res.status(400).json({
        status: 'error',
        message: 'Item name, current stock, and unit are required'
      });
    }
    
    if (currentStock < 0 || (minimumThreshold && minimumThreshold < 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Stock quantities cannot be negative'
      });
    }
    
    const newItem = {
      id: `I${String(inventory.length + 1).padStart(3, '0')}`,
      itemName,
      currentStock,
      unit,
      minimumThreshold: minimumThreshold || 5,
      lastUpdated: new Date().toISOString(),
      supplier: supplier || 'Unknown',
      unitPrice: unitPrice || 0
    };
    
    inventory.push(newItem);
    
    // Determine stock status
    const stockStatus = newItem.currentStock === 0 ? 'out-of-stock' : 
                       newItem.currentStock <= newItem.minimumThreshold ? 'low-stock' : 'in-stock';
    
    res.status(201).json({
      status: 'success',
      message: 'Inventory item created successfully',
      data: {
        ...newItem,
        stockStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create inventory item',
      error: error.message
    });
  }
});

/**
 * GET /api/inventory/alerts
 * Get low stock and out of stock alerts
 */
router.get('/alerts/stock', async (req, res) => {
  try {
    const lowStockItems = inventory.filter(item => 
      item.currentStock > 0 && item.currentStock <= item.minimumThreshold
    );
    
    const outOfStockItems = inventory.filter(item => 
      item.currentStock === 0
    );
    
    const alerts = [
      ...outOfStockItems.map(item => ({
        type: 'out-of-stock',
        severity: 'critical',
        itemId: item.id,
        itemName: item.itemName,
        currentStock: item.currentStock,
        message: `${item.itemName} is out of stock`
      })),
      ...lowStockItems.map(item => ({
        type: 'low-stock',
        severity: 'warning',
        itemId: item.id,
        itemName: item.itemName,
        currentStock: item.currentStock,
        minimumThreshold: item.minimumThreshold,
        message: `${item.itemName} is low in stock (${item.currentStock} ${item.unit} remaining)`
      }))
    ];
    
    res.status(200).json({
      status: 'success',
      message: 'Stock alerts retrieved successfully',
      data: {
        alerts,
        summary: {
          total: alerts.length,
          critical: outOfStockItems.length,
          warnings: lowStockItems.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve stock alerts',
      error: error.message
    });
  }
});

module.exports = router;
