/**
 * 📞 Call Logs API - Track and analyze call data
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  logCall, 
  getCallLogs, 
  getCallStats,
  initializeSampleData 
} from '@/lib/phoneSystemService';

export async function GET(request: NextRequest) {
  try {
    // Initialize sample data if needed
    initializeSampleData();
    
    const { searchParams } = new URL(request.url);
    const phoneNumberId = searchParams.get('phoneNumberId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const statsOnly = searchParams.get('stats') === 'true';
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;

    if (statsOnly) {
      const stats = getCallStats(phoneNumberId || undefined, days);
      return NextResponse.json({
        success: true,
        stats
      });
    }

    const callLogs = getCallLogs(phoneNumberId || undefined, limit);
    const stats = getCallStats(phoneNumberId || undefined, days);
    
    return NextResponse.json({
      success: true,
      callLogs,
      stats,
      total: callLogs.length
    });
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch call logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      phoneNumberId, 
      callerNumber, 
      callType, 
      duration, 
      handled, 
      handledBy, 
      intent, 
      success, 
      notes 
    } = body;

    // Validate required fields
    if (!phoneNumberId || !callerNumber || !callType || duration === undefined) {
      return NextResponse.json(
        { success: false, error: 'Phone number ID, caller number, call type, and duration are required' },
        { status: 400 }
      );
    }

    const newCallLog = logCall({
      phoneNumberId,
      callerNumber,
      callType,
      duration,
      timestamp: new Date(),
      handled: handled ?? false,
      handledBy: handledBy || 'staff',
      intent: intent || 'other',
      success: success ?? false,
      notes
    });

    return NextResponse.json({
      success: true,
      message: 'Call logged successfully',
      callLog: newCallLog
    });
  } catch (error) {
    console.error('Error logging call:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log call' },
      { status: 500 }
    );
  }
}
