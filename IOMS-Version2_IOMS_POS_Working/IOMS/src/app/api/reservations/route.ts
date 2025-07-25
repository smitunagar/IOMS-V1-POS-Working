/**
 * 📅 Reservation Management API - Real-time table booking from AI agent
 */

import { NextRequest, NextResponse } from 'next/server';

interface Reservation {
  id: string;
  reservationNumber: string;
  customerInfo: {
    name?: string;
    phone?: string;
    email?: string;
  };
  partySize: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  tableNumber?: string;
  source: 'phone' | 'web' | 'walk-in' | 'ai-agent';
  sessionId?: string; // For AI agent reservations
  specialRequests?: string;
  createdAt: Date;
  notes?: string;
}

// In-memory storage for reservations
const reservations: Map<string, Reservation> = new Map();
let reservationCounter = 2000;

// Sample table availability (in a real app, this would be more sophisticated)
const tables = [
  { number: 'T1', capacity: 2, status: 'available' },
  { number: 'T2', capacity: 2, status: 'available' },
  { number: 'T3', capacity: 4, status: 'available' },
  { number: 'T4', capacity: 4, status: 'available' },
  { number: 'T5', capacity: 6, status: 'available' },
  { number: 'T6', capacity: 6, status: 'available' },
  { number: 'T7', capacity: 8, status: 'available' },
  { number: 'T8', capacity: 8, status: 'available' },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        return handleCreateReservation(body);
      case 'update-status':
        return handleUpdateReservationStatus(body);
      case 'assign-table':
        return handleAssignTable(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in reservation management API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function handleCreateReservation(body: any) {
  const { reservationData, sessionId } = body;
  
  if (!reservationData || !reservationData.partySize || !reservationData.date || !reservationData.time) {
    return NextResponse.json(
      { success: false, error: 'Party size, date, and time are required' },
      { status: 400 }
    );
  }

  // Check if the requested time is available
  const isAvailable = checkAvailability(
    reservationData.date, 
    reservationData.time, 
    reservationData.partySize
  );
  
  if (!isAvailable.available) {
    return NextResponse.json(
      { 
        success: false, 
        error: isAvailable.reason || 'Time slot not available',
        suggestedTimes: isAvailable.suggestedTimes 
      },
      { status: 409 }
    );
  }

  const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const reservationNumber = `R${reservationCounter++}`;

  const reservation: Reservation = {
    id: reservationId,
    reservationNumber,
    customerInfo: reservationData.customerInfo || {},
    partySize: reservationData.partySize,
    date: reservationData.date,
    time: reservationData.time,
    status: 'confirmed',
    source: sessionId ? 'ai-agent' : 'web',
    sessionId,
    specialRequests: reservationData.specialRequests,
    createdAt: new Date(),
    notes: reservationData.notes
  };

  reservations.set(reservationId, reservation);

  // Log the reservation creation
  console.log(`📅 New Reservation: ${reservationNumber}`, {
    partySize: reservation.partySize,
    date: reservation.date,
    time: reservation.time,
    source: reservation.source
  });

  return NextResponse.json({
    success: true,
    reservation,
    message: `Reservation ${reservationNumber} confirmed`
  });
}

function handleUpdateReservationStatus(body: any) {
  const { reservationId, status, tableNumber, notes } = body;
  
  const reservation = reservations.get(reservationId);
  if (!reservation) {
    return NextResponse.json(
      { success: false, error: 'Reservation not found' },
      { status: 404 }
    );
  }

  reservation.status = status;
  if (tableNumber !== undefined) {
    reservation.tableNumber = tableNumber;
  }
  if (notes !== undefined) {
    reservation.notes = notes;
  }

  reservations.set(reservationId, reservation);

  console.log(`📋 Reservation Status Updated: ${reservation.reservationNumber} -> ${status}`);

  return NextResponse.json({
    success: true,
    reservation,
    message: `Reservation status updated to ${status}`
  });
}

function handleAssignTable(body: any) {
  const { reservationId, tableNumber } = body;
  
  const reservation = reservations.get(reservationId);
  if (!reservation) {
    return NextResponse.json(
      { success: false, error: 'Reservation not found' },
      { status: 404 }
    );
  }

  // Check if table exists and has sufficient capacity
  const table = tables.find(t => t.number === tableNumber);
  if (!table) {
    return NextResponse.json(
      { success: false, error: 'Table not found' },
      { status: 404 }
    );
  }

  if (table.capacity < reservation.partySize) {
    return NextResponse.json(
      { success: false, error: 'Table capacity insufficient for party size' },
      { status: 400 }
    );
  }

  reservation.tableNumber = tableNumber;
  reservation.status = 'seated';
  reservations.set(reservationId, reservation);

  console.log(`🪑 Table Assigned: ${reservation.reservationNumber} -> ${tableNumber}`);

  return NextResponse.json({
    success: true,
    reservation,
    message: `Table ${tableNumber} assigned to reservation ${reservation.reservationNumber}`
  });
}

function checkAvailability(date: string, time: string, partySize: number) {
  // Simple availability check - in a real app, this would be more sophisticated
  const requestedDateTime = new Date(`${date}T${time}`);
  const now = new Date();
  
  // Check if reservation is in the past
  if (requestedDateTime < now) {
    return { 
      available: false, 
      reason: 'Cannot make reservations for past dates/times',
      suggestedTimes: []
    };
  }

  // Check business hours (11 AM - 10 PM)
  const hour = parseInt(time.split(':')[0]);
  if (hour < 11 || hour > 21) {
    return { 
      available: false, 
      reason: 'Reservations available from 11:00 AM to 9:00 PM only',
      suggestedTimes: ['12:00', '13:00', '18:00', '19:00', '20:00']
    };
  }

  // Check if there are suitable tables available
  const suitableTables = tables.filter(table => table.capacity >= partySize);
  if (suitableTables.length === 0) {
    return { 
      available: false, 
      reason: `No tables available for party of ${partySize}`,
      suggestedTimes: []
    };
  }

  // Check for conflicting reservations (simplified - within 2 hours)
  const conflicts = Array.from(reservations.values()).filter(res => {
    if (res.date !== date || ['cancelled', 'no-show', 'completed'].includes(res.status)) {
      return false;
    }
    
    const resTime = new Date(`${res.date}T${res.time}`);
    const timeDiff = Math.abs(requestedDateTime.getTime() - resTime.getTime()) / (1000 * 60); // minutes
    
    return timeDiff < 120; // 2 hours buffer
  });

  // If too many conflicts, suggest alternative times
  if (conflicts.length >= suitableTables.length) {
    const suggestedTimes = generateSuggestedTimes(date, time);
    return { 
      available: false, 
      reason: 'Time slot is busy, please try a different time',
      suggestedTimes
    };
  }

  return { available: true };
}

function generateSuggestedTimes(date: string, requestedTime: string): string[] {
  const baseTime = parseInt(requestedTime.split(':')[0]);
  const suggestions: string[] = [];
  
  // Suggest times 1-2 hours before and after
  for (let offset of [-2, -1, 1, 2]) {
    const suggestedHour = baseTime + offset;
    if (suggestedHour >= 11 && suggestedHour <= 21) {
      suggestions.push(`${suggestedHour.toString().padStart(2, '0')}:00`);
    }
  }
  
  return suggestions;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const reservationId = url.searchParams.get('reservationId');
    const date = url.searchParams.get('date');
    const status = url.searchParams.get('status');
    const source = url.searchParams.get('source');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    if (reservationId) {
      const reservation = reservations.get(reservationId);
      if (!reservation) {
        return NextResponse.json(
          { success: false, error: 'Reservation not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        reservation
      });
    }

    // Filter reservations
    let filteredReservations = Array.from(reservations.values());
    
    if (date) {
      filteredReservations = filteredReservations.filter(res => res.date === date);
    }
    
    if (status) {
      filteredReservations = filteredReservations.filter(res => res.status === status);
    }
    
    if (source) {
      filteredReservations = filteredReservations.filter(res => res.source === source);
    }

    // Sort by date and time
    filteredReservations = filteredReservations
      .sort((a, b) => {
        const dateTimeA = new Date(`${a.date}T${a.time}`);
        const dateTimeB = new Date(`${b.date}T${b.time}`);
        return dateTimeB.getTime() - dateTimeA.getTime();
      })
      .slice(0, limit);

    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const stats = {
      total: reservations.size,
      today: Array.from(reservations.values()).filter(r => r.date === today).length,
      confirmed: Array.from(reservations.values()).filter(r => r.status === 'confirmed').length,
      seated: Array.from(reservations.values()).filter(r => r.status === 'seated').length,
      completed: Array.from(reservations.values()).filter(r => r.status === 'completed').length,
      pending: Array.from(reservations.values()).filter(r => r.status === 'pending').length
    };

    return NextResponse.json({
      success: true,
      reservations: filteredReservations,
      stats,
      tables,
      total: filteredReservations.length
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId, updates } = body;

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    const reservation = reservations.get(reservationId);
    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (updates.status) reservation.status = updates.status;
    if (updates.tableNumber !== undefined) reservation.tableNumber = updates.tableNumber;
    if (updates.specialRequests !== undefined) reservation.specialRequests = updates.specialRequests;
    if (updates.notes !== undefined) reservation.notes = updates.notes;
    if (updates.customerInfo) reservation.customerInfo = { ...reservation.customerInfo, ...updates.customerInfo };

    reservations.set(reservationId, reservation);

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Reservation updated successfully'
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update reservation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const reservationId = url.searchParams.get('reservationId');

    if (!reservationId) {
      return NextResponse.json(
        { success: false, error: 'Reservation ID is required' },
        { status: 400 }
      );
    }

    const reservation = reservations.get(reservationId);
    if (!reservation) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation of pending/confirmed reservations
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel reservation in current status' },
        { status: 400 }
      );
    }

    reservation.status = 'cancelled';
    reservations.set(reservationId, reservation);

    console.log(`❌ Reservation Cancelled: ${reservation.reservationNumber}`);

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel reservation' },
      { status: 500 }
    );
  }
}
