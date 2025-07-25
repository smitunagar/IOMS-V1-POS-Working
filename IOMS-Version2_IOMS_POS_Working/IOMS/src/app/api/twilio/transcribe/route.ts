/**
 * 📞 Twilio Transcription Callback
 * Handles transcription webhooks from Twilio
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Transcription callback received...');
    
    const formData = await request.formData();
    const transcriptionText = formData.get('TranscriptionText');
    const transcriptionStatus = formData.get('TranscriptionStatus');
    const callSid = formData.get('CallSid');
    
    console.log('📝 Transcription Data:', {
      callSid,
      transcriptionText,
      transcriptionStatus
    });

    // Store transcription for analysis (optional)
    if (transcriptionText && transcriptionStatus === 'completed') {
      // You could store this in a database for analytics
      console.log('💾 Storing transcription for analytics...');
    }

    return NextResponse.json({ 
      message: 'Transcription received',
      status: 'success'
    });

  } catch (error) {
    console.error('❌ Error handling transcription:', error);
    return NextResponse.json({ 
      error: 'Failed to process transcription'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Twilio Transcription Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}
