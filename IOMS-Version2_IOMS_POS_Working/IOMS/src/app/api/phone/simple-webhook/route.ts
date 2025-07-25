import { NextRequest, NextResponse } from 'next/server';
import { 
  createCallSession, 
  updateCallSession, 
  getCallSessionBySid,
  processAICall,
  getPhoneNumberByNumber,
  isWithinBusinessHours
} from '@/lib/simplePhoneService';

// ==========================================
// SIMPLE TWILIO WEBHOOK HANDLER
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const {
      CallSid,
      From,
      To,
      CallStatus,
      SpeechResult
    } = data as Record<string, string>;

    console.log('Incoming Call:', { CallSid, From, To, CallStatus });

    // Find the phone number in our system
    const phoneNumber = getPhoneNumberByNumber(To);
    if (!phoneNumber || !phoneNumber.isActive) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>This number is not available. Please try again later.</Say>
    <Hangup/>
</Response>`,
        { 
          status: 200,
          headers: { 'Content-Type': 'application/xml' }
        }
      );
    }

    // Handle different call statuses
    switch (CallStatus) {
      case 'ringing':
        return handleIncomingCall(CallSid, From, phoneNumber.id);
      
      case 'in-progress':
        if (SpeechResult) {
          return handleSpeechInput(CallSid, SpeechResult);
        }
        return handleCallInProgress(CallSid);
      
      case 'completed':
      case 'failed':
        return handleCallEnd(CallSid, CallStatus);
      
      default:
        return new NextResponse('OK', { status: 200 });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function handleIncomingCall(callSid: string, from: string, phoneNumberId: string) {
  // Create call session
  const session = createCallSession({
    callSid,
    phoneNumberId,
    callerNumber: from
  });

  // Check business hours
  const withinHours = isWithinBusinessHours(phoneNumberId);
  
  if (!withinHours) {
    updateCallSession(session.id, {
      status: 'completed',
      aiProcessed: false
    });

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Thank you for calling! We're currently closed. Please call back during business hours or leave a message after the beep.</Say>
    <Record action="/api/phone/simple-webhook/voicemail" maxLength="120" />
</Response>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'application/xml' }
      }
    );
  }

  // Start AI conversation
  updateCallSession(session.id, {
    status: 'in-progress',
    aiProcessed: true
  });

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/phone/simple-webhook" timeout="10" speechTimeout="3">
        <Say>Thank you for calling! How can I help you today? I can take your order or help you make a reservation.</Say>
    </Gather>
    <Say>I didn't hear you. Let me try again.</Say>
    <Redirect>/api/phone/simple-webhook</Redirect>
</Response>`,
    { 
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    }
  );
}

async function handleSpeechInput(callSid: string, speechResult: string) {
  const session = getCallSessionBySid(callSid);
  if (!session) {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>I'm sorry, there was an error. Please try calling again.</Say>
    <Hangup/>
</Response>`,
      { status: 200, headers: { 'Content-Type': 'application/xml' } }
    );
  }

  // Process with AI
  const aiResponse = processAICall(session.id, speechResult);
  
  // Handle different intents
  if (aiResponse.requiresAction) {
    if (aiResponse.actionType === 'create_order') {
      // Mark that an order will be created
      updateCallSession(session.id, {
        orderCreated: true
      });

      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/phone/simple-webhook" timeout="10" speechTimeout="3">
        <Say>${aiResponse.response} Please tell me what you'd like to order.</Say>
    </Gather>
    <Say>Perfect! I've taken down your order. It will be ready for pickup in 20-25 minutes. Thank you for choosing us!</Say>
    <Hangup/>
</Response>`,
        { status: 200, headers: { 'Content-Type': 'application/xml' } }
      );
    }
    
    if (aiResponse.actionType === 'create_reservation') {
      // Mark that a reservation will be created
      updateCallSession(session.id, {
        reservationCreated: true
      });

      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/phone/simple-webhook" timeout="10" speechTimeout="3">
        <Say>${aiResponse.response}</Say>
    </Gather>
    <Say>Great! Your reservation has been confirmed. We'll see you soon!</Say>
    <Hangup/>
</Response>`,
        { status: 200, headers: { 'Content-Type': 'application/xml' } }
      );
    }
  }

  // Default response for inquiries
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/phone/simple-webhook" timeout="10" speechTimeout="3">
        <Say>${aiResponse.response}</Say>
    </Gather>
    <Say>Thank you for calling! Have a great day!</Say>
    <Hangup/>
</Response>`,
    { status: 200, headers: { 'Content-Type': 'application/xml' } }
  );
}

async function handleCallInProgress(callSid: string) {
  return new NextResponse('OK', { status: 200 });
}

async function handleCallEnd(callSid: string, status: string) {
  const session = getCallSessionBySid(callSid);
  if (session) {
    const duration = session.startTime ? 
      Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000) : 0;

    updateCallSession(session.id, {
      status: status as any,
      endTime: new Date(),
      duration
    });
  }

  return new NextResponse('OK', { status: 200 });
}

// Handle GET requests
export async function GET(request: NextRequest) {
  return new NextResponse('Simple Phone Webhook Active', { status: 200 });
}
