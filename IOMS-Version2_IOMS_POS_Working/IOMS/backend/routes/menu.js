const express = require('express');
const { menuItems } = require('../data/mockData');

const router = express.Router();

/**
 * GET /api/menu
 * Fetch the current menu items with name, price, availability, and category
 */
router.get('/', async (req, res) => {
  try {
    const { category, available } = req.query;
    
    let filteredMenu = [...menuItems];
    
    // Filter by category if provided
    if (category) {
      filteredMenu = filteredMenu.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Filter by availability if provided
    if (available !== undefined) {
      const isAvailable = available === 'true';
      filteredMenu = filteredMenu.filter(item => item.availability === isAvailable);
    }
    
    res.status(200).json(filteredMenu);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve menu items',
      error: error.message
    });
  }
});

/**
 * GET /api/menu/:itemId
 * Get a specific menu item by ID
 */
router.get('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const menuItem = menuItems.find(item => item.id === itemId);
    
    if (!menuItem) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Menu item retrieved successfully',
      data: menuItem,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve menu item',
      error: error.message
    });
  }
});

/**
 * POST /api/menu
 * Add a new menu item (for admin use)
 */
router.post('/', async (req, res) => {
  try {
    const { name, price, category, description, preparationTime, ingredients } = req.body;
    
    // Basic validation
    if (!name || !price || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, price, and category are required fields'
      });
    }
    
    const newItem = {
      id: `M${String(menuItems.length + 1).padStart(3, '0')}`,
      name,
      price: parseFloat(price),
      category,
      availability: true,
      description: description || '',
      preparationTime: preparationTime || 15,
      ingredients: ingredients || []
    };
    
    menuItems.push(newItem);
    
    res.status(201).json({
      status: 'success',
      message: 'Menu item created successfully',
      data: newItem,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create menu item',
      error: error.message
    });
  }
});

/**
 * PATCH /api/menu/:itemId
 * Update menu item availability or other properties
 */
router.patch('/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;
    
    const itemIndex = menuItems.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Menu item not found'
      });
    }
    
    // Update the item
    menuItems[itemIndex] = { ...menuItems[itemIndex], ...updates };
    
    res.status(200).json({
      status: 'success',
      message: 'Menu item updated successfully',
      data: menuItems[itemIndex],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update menu item',
      error: error.message
    });
  }
});

module.exports = router;
