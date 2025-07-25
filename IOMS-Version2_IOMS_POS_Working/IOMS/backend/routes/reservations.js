const express = require('express');
const { reservations, tables } = require('../data/mockData');

const router = express.Router();

/**
 * POST /api/reservations
 * Book a table with name, phone, table number, and time slot
 */
router.post('/', async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      tableId, 
      reservationTime, 
      partySize, 
      specialRequests 
    } = req.body;
    
    // Basic validation
    if (!customerName || !customerPhone || !tableId || !reservationTime || !partySize) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer name, phone, table ID, reservation time, and party size are required'
      });
    }
    
    // Validate table exists
    const table = tables.find(t => t.id === tableId);
    if (!table) {
      return res.status(404).json({
        status: 'error',
        message: 'Table not found'
      });
    }
    
    // Check if table capacity is sufficient
    if (table.capacity < partySize) {
      return res.status(400).json({
        status: 'error',
        message: `Table capacity (${table.capacity}) is insufficient for party size (${partySize})`
      });
    }
    
    // Validate reservation time is in the future
    const reservationDate = new Date(reservationTime);
    const now = new Date();
    
    if (reservationDate <= now) {
      return res.status(400).json({
        status: 'error',
        message: 'Reservation time must be in the future'
      });
    }
    
    // Check if table is available at the requested time
    const conflictingReservation = reservations.find(reservation => {
      if (reservation.tableId !== tableId) return false;
      
      const existingTime = new Date(reservation.reservationTime);
      const timeDiff = Math.abs(existingTime - reservationDate) / (1000 * 60); // in minutes
      
      // Check if there's a conflict within 2 hours
      return timeDiff < 120 && reservation.status !== 'cancelled';
    });
    
    if (conflictingReservation) {
      return res.status(409).json({
        status: 'error',
        message: 'Table is not available at the requested time',
        conflictingReservation: {
          time: conflictingReservation.reservationTime,
          customer: conflictingReservation.customerName
        }
      });
    }
    
    // Create new reservation
    const newReservation = {
      id: `R${String(reservations.length + 1).padStart(3, '0')}`,
      customerName,
      customerPhone,
      tableId,
      tableNumber: table.number,
      reservationTime,
      partySize,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      specialRequests: specialRequests || null
    };
    
    reservations.push(newReservation);
    
    // Update table status
    const tableIndex = tables.findIndex(t => t.id === tableId);
    if (tableIndex !== -1) {
      tables[tableIndex].isAvailable = false;
      tables[tableIndex].reservedUntil = new Date(reservationDate.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
    }
    
    res.status(201).json(newReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create reservation',
      error: error.message
    });
  }
});

/**
 * GET /api/reservations
 * Get all reservations with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { date, status, customerPhone } = req.query;
    
    let filteredReservations = [...reservations];
    
    // Filter by date
    if (date) {
      const filterDate = new Date(date).toDateString();
      filteredReservations = filteredReservations.filter(reservation => 
        new Date(reservation.reservationTime).toDateString() === filterDate
      );
    }
    
    // Filter by status
    if (status) {
      filteredReservations = filteredReservations.filter(reservation => 
        reservation.status === status
      );
    }
    
    // Filter by customer phone
    if (customerPhone) {
      filteredReservations = filteredReservations.filter(reservation => 
        reservation.customerPhone.includes(customerPhone)
      );
    }
    
    // Sort by reservation time
    filteredReservations.sort((a, b) => new Date(a.reservationTime) - new Date(b.reservationTime));
    
    res.status(200).json({
      status: 'success',
      message: 'Reservations retrieved successfully',
      data: {
        reservations: filteredReservations,
        total: filteredReservations.length,
        summary: {
          confirmed: filteredReservations.filter(r => r.status === 'confirmed').length,
          cancelled: filteredReservations.filter(r => r.status === 'cancelled').length,
          completed: filteredReservations.filter(r => r.status === 'completed').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve reservations',
      error: error.message
    });
  }
});

/**
 * GET /api/reservations/:reservationId
 * Get a specific reservation by ID
 */
router.get('/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    const reservation = reservations.find(r => r.id === reservationId);
    
    if (!reservation) {
      return res.status(404).json({
        status: 'error',
        message: 'Reservation not found'
      });
    }
    
    // Include table information
    const table = tables.find(t => t.id === reservation.tableId);
    const reservationWithTable = {
      ...reservation,
      table: table ? {
        number: table.number,
        capacity: table.capacity,
        location: table.location
      } : null
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Reservation retrieved successfully',
      data: reservationWithTable,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve reservation',
      error: error.message
    });
  }
});

/**
 * PATCH /api/reservations/:reservationId
 * Update reservation status or details
 */
router.patch('/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status, reservationTime, partySize, specialRequests } = req.body;
    
    const reservationIndex = reservations.findIndex(r => r.id === reservationId);
    
    if (reservationIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Reservation not found'
      });
    }
    
    const validStatuses = ['confirmed', 'cancelled', 'completed', 'no-show'];
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Update reservation
    if (status) reservations[reservationIndex].status = status;
    if (reservationTime) reservations[reservationIndex].reservationTime = reservationTime;
    if (partySize) reservations[reservationIndex].partySize = partySize;
    if (specialRequests !== undefined) reservations[reservationIndex].specialRequests = specialRequests;
    
    reservations[reservationIndex].lastUpdated = new Date().toISOString();
    
    // If cancelling reservation, free up the table
    if (status === 'cancelled') {
      const tableIndex = tables.findIndex(t => t.id === reservations[reservationIndex].tableId);
      if (tableIndex !== -1) {
        tables[tableIndex].isAvailable = true;
        tables[tableIndex].reservedUntil = null;
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Reservation updated successfully',
      data: reservations[reservationIndex],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update reservation',
      error: error.message
    });
  }
});

/**
 * DELETE /api/reservations/:reservationId
 * Cancel a reservation
 */
router.delete('/:reservationId', async (req, res) => {
  try {
    const { reservationId } = req.params;
    
    const reservationIndex = reservations.findIndex(r => r.id === reservationId);
    
    if (reservationIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Reservation not found'
      });
    }
    
    const reservation = reservations[reservationIndex];
    
    // Free up the table
    const tableIndex = tables.findIndex(t => t.id === reservation.tableId);
    if (tableIndex !== -1) {
      tables[tableIndex].isAvailable = true;
      tables[tableIndex].reservedUntil = null;
    }
    
    // Remove reservation
    reservations.splice(reservationIndex, 1);
    
    res.status(200).json({
      status: 'success',
      message: 'Reservation cancelled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel reservation',
      error: error.message
    });
  }
});

module.exports = router;
