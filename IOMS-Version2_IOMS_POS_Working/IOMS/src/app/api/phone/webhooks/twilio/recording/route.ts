import { NextRequest, NextResponse } from 'next/server';
import { 
  updateCallSession, 
  getCallSessionBySid 
} from '@/lib/phoneSystemService';

// ==========================================
// RECORDING WEBHOOK HANDLER
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const {
      CallSid,
      RecordingUrl,
      RecordingDuration,
      RecordingSid
    } = data as Record<string, string>;

    console.log('Recording Webhook:', { CallSid, RecordingUrl, RecordingDuration });

    // Get the call session
    const session = getCallSessionBySid(CallSid);
    if (session) {
      // Update session with recording info
      updateCallSession(session.id, {
        recordingUrl: RecordingUrl,
        duration: parseInt(RecordingDuration) || session.duration
      });
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('Recording webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return new NextResponse('Recording Webhook Endpoint Active', { status: 200 });
}
