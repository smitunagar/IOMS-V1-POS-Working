import { NextRequest, NextResponse } from 'next/server';
import { getCallLogs } from '@/lib/simplePhoneService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumberId = searchParams.get('phoneNumberId') || undefined;
    
    const callLogs = getCallLogs(phoneNumberId);
    
    return NextResponse.json({
      success: true,
      callLogs,
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
