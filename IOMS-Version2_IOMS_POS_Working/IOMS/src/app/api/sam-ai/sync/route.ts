/**
 * 🔄 SAM AI Data Sync API
 * Syncs server-side reservation data with client-side storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadFromPersistentStorage, saveToPersistentStorage } from '@/lib/retellAiIntegration';

/**
 * GET: Fetch server-side data for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'samAiReservations';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`📥 Loading persistent data for ${type}_${userId}`);
    
    // Load from persistent storage
    const data = await loadFromPersistentStorage(userId, type);
    
    console.log(`📤 Serving persistent data for ${type}_${userId}:`, data.length, 'items');
    
    return NextResponse.json({
      success: true,
      data,
      key: `${type}_${userId}`,
      count: data.length
    });
    
  } catch (error) {
    console.error('Error fetching persistent data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persistent data' },
      { status: 500 }
    );
  }
}

/**
 * POST: Merge client data with server data
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, type, clientData } = await request.json();
    
    if (!userId || !type) {
      return NextResponse.json(
        { error: 'userId and type are required' },
        { status: 400 }
      );
    }
    
    // Load current server data
    const serverData = await loadFromPersistentStorage(userId, type);
    
    // Merge client and server data
    const merged = [...(clientData || [])];
    let addedCount = 0;
    
    for (const serverItem of serverData) {
      if (!merged.find(item => item.id === serverItem.id)) {
        merged.push(serverItem);
        addedCount++;
      }
    }
    
    console.log(`🔄 Merged data for ${type}_${userId}: ${addedCount} new items added`);
    
    return NextResponse.json({
      success: true,
      mergedData: merged,
      addedFromServer: addedCount,
      totalCount: merged.length
    });
    
  } catch (error) {
    console.error('Error merging data:', error);
    return NextResponse.json(
      { error: 'Failed to merge data' },
      { status: 500 }
    );
  }
}
