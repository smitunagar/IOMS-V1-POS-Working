import { NextRequest, NextResponse } from 'next/server';
import { 
  updateCallSession, 
  getCallSessionBySid 
} from '@/lib/phoneSystemService';

// ==========================================
// TRANSCRIPTION WEBHOOK HANDLER
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const {
      CallSid,
      TranscriptionText,
      TranscriptionUrl,
      TranscriptionStatus
    } = data as Record<string, string>;

    console.log('Transcription Webhook:', { CallSid, TranscriptionStatus });

    // Get the call session
    const session = getCallSessionBySid(CallSid);
    if (session && TranscriptionStatus === 'completed') {
      // Update session with transcription info
      updateCallSession(session.id, {
        transcriptUrl: TranscriptionUrl
      });

      // Here you could also save the full transcript text to a database
      // or send it to an analytics service
      console.log('Call transcript:', TranscriptionText);
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('Transcription webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return new NextResponse('Transcription Webhook Endpoint Active', { status: 200 });
}
