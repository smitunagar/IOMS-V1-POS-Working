import { NextRequest, NextResponse } from 'next/server';

// ==========================================
// VOICEMAIL WEBHOOK HANDLER
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const {
      CallSid,
      From,
      To,
      RecordingUrl,
      RecordingDuration,
      Digits
    } = data as Record<string, string>;

    console.log('Voicemail Webhook:', { CallSid, From, To, RecordingDuration });

    // Here you would typically:
    // 1. Save the voicemail to your database
    // 2. Send notification to staff
    // 3. Optionally transcribe the voicemail
    // 4. Send confirmation email/SMS to customer

    // Mock voicemail processing
    const voicemail = {
      id: `vm_${Date.now()}`,
      callSid: CallSid,
      from: From,
      to: To,
      recordingUrl: RecordingUrl,
      duration: parseInt(RecordingDuration) || 0,
      timestamp: new Date(),
      transcribed: false,
      status: 'new'
    };

    console.log('Voicemail saved:', voicemail);

    // Return TwiML response
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you for your message. We'll get back to you as soon as possible. Have a great day!</Say>
    <Hangup/>
</Response>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'application/xml' }
      }
    );

  } catch (error) {
    console.error('Voicemail webhook error:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Thank you for calling. Goodbye!</Say>
    <Hangup/>
</Response>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'application/xml' }
      }
    );
  }
}

export async function GET(request: NextRequest) {
  return new NextResponse('Voicemail Webhook Endpoint Active', { status: 200 });
}
