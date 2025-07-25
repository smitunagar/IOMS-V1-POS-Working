const express = require('express');
const { tables } = require('../data/mockData');

const router = express.Router();

/**
 * GET /api/tables/availability
 * Return available tables with timestamps and capacity
 */
router.get('/availability', async (req, res) => {
  try {
    const { capacity, date, time } = req.query;
    
    let availableTables = tables.filter(table => {
      // Check if table is currently available
      if (!table.isAvailable) return false;
      
      // Check if table is reserved and still within reservation time
      if (table.reservedUntil) {
        const reservationEnd = new Date(table.reservedUntil);
        const now = new Date();
        if (now < reservationEnd) return false;
      }
      
      // Filter by capacity if specified
      if (capacity && table.capacity < parseInt(capacity)) return false;
      
      return true;
    });
    
    // Sort by capacity (smaller tables first)
    availableTables.sort((a, b) => a.capacity - b.capacity);
    
    res.status(200).json(availableTables);
  } catch (error) {
    console.error('Error fetching table availability:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve table availability',
      error: error.message
    });
  }
});

/**
 * GET /api/tables
 * Get all tables with their current status
 */
router.get('/', async (req, res) => {
  try {
    const currentTime = new Date();
    
    // Update table availability based on reservation times
    const updatedTables = tables.map(table => {
      const tableData = { ...table };
      
      // If reservation time has passed, make table available
      if (tableData.reservedUntil && new Date(tableData.reservedUntil) <= currentTime) {
        tableData.isAvailable = true;
        tableData.reservedUntil = null;
      }
      
      return tableData;
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Tables retrieved successfully',
      data: {
        tables: updatedTables,
        total: updatedTables.length,
        capacityBreakdown: {
          '2-seater': updatedTables.filter(t => t.capacity === 2).length,
          '4-seater': updatedTables.filter(t => t.capacity === 4).length,
          '6-seater': updatedTables.filter(t => t.capacity === 6).length,
          '8-seater': updatedTables.filter(t => t.capacity >= 8).length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve tables',
      error: error.message
    });
  }
});

/**
 * GET /api/tables/:tableId
 * Get specific table information
 */
router.get('/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    
    const table = tables.find(t => t.id === tableId);
    
    if (!table) {
      return res.status(404).json({
        status: 'error',
        message: 'Table not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Table retrieved successfully',
      data: table,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve table',
      error: error.message
    });
  }
});

/**
 * PATCH /api/tables/:tableId
 * Update table status (for admin use)
 */
router.patch('/:tableId', async (req, res) => {
  try {
    const { tableId } = req.params;
    const { isAvailable, reservedUntil } = req.body;
    
    const tableIndex = tables.findIndex(t => t.id === tableId);
    
    if (tableIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Table not found'
      });
    }
    
    // Update table status
    if (isAvailable !== undefined) {
      tables[tableIndex].isAvailable = isAvailable;
    }
    
    if (reservedUntil !== undefined) {
      tables[tableIndex].reservedUntil = reservedUntil;
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Table status updated successfully',
      data: tables[tableIndex],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update table',
      error: error.message
    });
  }
});

module.exports = router;
