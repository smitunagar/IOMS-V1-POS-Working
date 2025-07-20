/**
 * 🔄 Simple SAM AI Data Endpoint
 * Returns recent webhook reservations for testing
 */

import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demonstration
const recentReservations: Record<string, any[]> = {};

/**
 * Store reservation from webhook
 */
export function storeWebhookReservation(userId: string, reservation: any) {
  if (!recentReservations[userId]) {
    recentReservations[userId] = [];
  }
  recentReservations[userId].push(reservation);
  
  // Keep only last 10 reservations
  if (recentReservations[userId].length > 10) {
    recentReservations[userId] = recentReservations[userId].slice(-10);
  }
  
  console.log(`📦 Stored webhook reservation for ${userId}:`, reservation.id);
}

/**
 * GET: Fetch webhook reservations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || 'user_1752538556589_u705p8e0q';
    
    const reservations = recentReservations[userId] || [];
    
    console.log(`📤 Serving webhook reservations for ${userId}:`, reservations.length, 'items');
    
    return NextResponse.json({
      success: true,
      data: reservations,
      count: reservations.length,
      message: `Found ${reservations.length} webhook reservations`
    });
    
  } catch (error) {
    console.error('Error fetching webhook reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook reservations' },
      { status: 500 }
    );
  }
}
