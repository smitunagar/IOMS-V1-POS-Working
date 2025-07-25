/**
 * 🍽️ Voice AI Agent - Table Reservation API
 * Handles reservation creation from voice calls
 */

import { NextRequest, NextResponse } from 'next/server';

interface ReservationRequest {
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_datetime: string;
  special_requests?: string;
  source: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Voice Agent - Processing reservation request...');
    
    const data: ReservationRequest = await request.json();
    
    // Validate required fields
    if (!data.customer_name || !data.party_size || !data.reservation_datetime) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, party_size, reservation_datetime' },
        { status: 400 }
      );
    }

    // Generate reservation ID
    const reservation_id = `VOICE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create reservation object
    const reservation = {
      reservation_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone || 'Voice Call',
      customer_email: `voice-${reservation_id}@temp.com`, // Temporary email
      party_size: data.party_size,
      reservation_datetime: data.reservation_datetime,
      special_requests: data.special_requests || '',
      status: data.status || 'confirmed',
      source: 'voice-ai-agent',
      created_at: new Date().toISOString(),
      table_number: null // Will be assigned by staff
    };

    console.log('🎯 Creating voice reservation:', reservation);

    // Store in localStorage (simulating database)
    const storageKey = 'voice_reservations';
    
    // Get existing reservations
    let existingReservations = [];
    try {
      const stored = localStorage?.getItem(storageKey);
      if (stored) {
        existingReservations = JSON.parse(stored);
      }
    } catch (e) {
      console.log('No existing reservations in localStorage');
    }

    // Add new reservation
    existingReservations.push(reservation);
    
    // Save back to localStorage
    try {
      localStorage?.setItem(storageKey, JSON.stringify(existingReservations));
    } catch (e) {
      console.log('Could not save to localStorage');
    }

    // Also store in session for immediate access
    try {
      sessionStorage?.setItem(`reservation_${reservation_id}`, JSON.stringify(reservation));
    } catch (e) {
      console.log('Could not save to sessionStorage');
    }

    // Broadcast event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('newVoiceReservation', { 
        detail: reservation 
      }));
    }

    console.log('✅ Voice reservation created successfully:', reservation_id);

    return NextResponse.json({
      success: true,
      reservation_id,
      reservation,
      message: `Reservation confirmed for ${data.customer_name} on ${new Date(data.reservation_datetime).toLocaleDateString()}`
    });

  } catch (error) {
    console.error('❌ Error creating voice reservation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create reservation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('id');

    if (reservationId) {
      // Get specific reservation
      const storageKey = 'voice_reservations';
      const stored = localStorage?.getItem(storageKey);
      
      if (stored) {
        const reservations = JSON.parse(stored);
        const reservation = reservations.find((r: any) => r.reservation_id === reservationId);
        
        if (reservation) {
          return NextResponse.json({ reservation });
        } else {
          return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }
      }
    } else {
      // Get all voice reservations
      const storageKey = 'voice_reservations';
      const stored = localStorage?.getItem(storageKey);
      const reservations = stored ? JSON.parse(stored) : [];
      
      return NextResponse.json({ 
        reservations,
        count: reservations.length 
      });
    }

  } catch (error) {
    console.error('❌ Error fetching voice reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}
