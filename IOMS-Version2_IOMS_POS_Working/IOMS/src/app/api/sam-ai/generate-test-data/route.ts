/**
 * 🧪 Test Data Generation API
 * Creates dummy reservations for testing the SAM AI dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createDummyReservationsForUser } from '@/lib/testDataGenerator';

/**
 * POST: Generate dummy reservations
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, count } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    const reservationCount = count || 5;
    const dummyReservations = createDummyReservationsForUser(userId, reservationCount);
    
    console.log(`🧪 Generated ${dummyReservations.length} dummy reservations for ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: `Created ${dummyReservations.length} dummy reservations`,
      reservations: dummyReservations,
      count: dummyReservations.length
    });
    
  } catch (error) {
    console.error('Error generating dummy reservations:', error);
    return NextResponse.json(
      { error: 'Failed to generate dummy reservations' },
      { status: 500 }
    );
  }
}

/**
 * GET: Generate dummy reservations with default parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId') || 'user_1752538556589_u705p8e0q';
    const count = parseInt(searchParams.get('count') || '5');
    
    const dummyReservations = createDummyReservationsForUser(userId, count);
    
    console.log(`🧪 Generated ${dummyReservations.length} dummy reservations via GET for ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: `Created ${dummyReservations.length} dummy reservations`,
      reservations: dummyReservations,
      count: dummyReservations.length
    });
    
  } catch (error) {
    console.error('Error generating dummy reservations:', error);
    return NextResponse.json(
      { error: 'Failed to generate dummy reservations' },
      { status: 500 }
    );
  }
}
