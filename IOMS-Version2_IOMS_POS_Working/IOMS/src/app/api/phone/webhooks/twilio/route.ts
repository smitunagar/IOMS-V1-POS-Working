import { NextRequest, NextResponse } from 'next/server';
import { 
  createCallSession, 
  updateCallSession, 
  getCallSessionBySid,
  initializeAICallProcessor,
  processAICallInput,
  generateWebhookResponse,
  getPhoneNumberByNumber,
  isWithinBusinessHours
} from '@/lib/phoneSystemService';

// ==========================================
// TWILIO WEBHOOK HANDLER
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
      Direction,
      RecordingUrl,
      TranscriptionText
    } = data as Record<string, string>;

    console.log('Twilio Webhook:', { CallSid, From, To, CallStatus, Direction });

    // Find the phone number in our system
    const phoneNumber = getPhoneNumberByNumber(To);
    if (!phoneNumber) {
      return new NextResponse(
        generateWebhookResponse('twilio', 'reject'),
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
        return handleCallInProgress(CallSid);
      
      case 'completed':
      case 'failed':
      case 'busy':
      case 'no-answer':
        return handleCallEnd(CallSid, CallStatus);
      
      default:
        console.log('Unknown call status:', CallStatus);
        return new NextResponse('OK', { status: 200 });
    }

  } catch (error) {
    console.error('Twilio webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function handleIncomingCall(callSid: string, from: string, phoneNumberId: string) {
  // Create call session
  const session = createCallSession({
    callSid,
    phoneNumberId,
    callerNumber: from,
    voipProvider: 'twilio'
  });

  // Check if we're within business hours
  const phoneNumber = getPhoneNumberByNumber(phoneNumberId);
  const withinHours = phoneNumber ? isWithinBusinessHours(phoneNumber.id) : false;

  if (!withinHours) {
    // Send to voicemail
    updateCallSession(session.id, {
      status: 'completed',
      aiProcessed: false
    });

    return new NextResponse(
      generateWebhookResponse('twilio', 'voicemail', { recordCall: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/xml' }
      }
    );
  }

  // Check if AI is enabled for this number
  const enableAI = phoneNumber?.autoAttendantEnabled ?? false;

  if (enableAI) {
    // Initialize AI processor
    initializeAICallProcessor(session.id);
    
    updateCallSession(session.id, {
      status: 'in-progress',
      aiProcessed: true,
      aiAgentId: `ai_agent_${session.id}`
    });

    return new NextResponse(
      generateWebhookResponse('twilio', 'answer', { 
        recordCall: true,
        enableAI: true
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/xml' }
      }
    );
  }

  // Forward to staff or voicemail
  return new NextResponse(
    generateWebhookResponse('twilio', 'voicemail', { recordCall: true }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    }
  );
}

async function handleCallInProgress(callSid: string) {
  const session = getCallSessionBySid(callSid);
  if (!session) {
    return new NextResponse('Session not found', { status: 404 });
  }

  // Update session status
  updateCallSession(session.id, {
    status: 'in-progress'
  });

  return new NextResponse('OK', { status: 200 });
}

async function handleCallEnd(callSid: string, status: string) {
  const session = getCallSessionBySid(callSid);
  if (!session) {
    return new NextResponse('Session not found', { status: 404 });
  }

  // Calculate duration
  const duration = session.startTime ? 
    Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000) : 0;

  // Update session with final status
  updateCallSession(session.id, {
    status: status as any,
    endTime: new Date(),
    duration
  });

  return new NextResponse('OK', { status: 200 });
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hubChallenge = searchParams.get('hub.challenge');
  
  if (hubChallenge) {
    return new NextResponse(hubChallenge, { status: 200 });
  }
  
  return new NextResponse('Twilio Webhook Endpoint Active', { status: 200 });
}
