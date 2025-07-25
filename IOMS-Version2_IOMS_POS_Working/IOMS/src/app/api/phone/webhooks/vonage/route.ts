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
// VONAGE (NEXMO) WEBHOOK HANDLER
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      uuid,
      from,
      to,
      status,
      direction,
      conversation_uuid,
      recording_url,
      transcription
    } = data;

    console.log('Vonage Webhook:', { uuid, from, to, status, direction });

    // Find the phone number in our system
    const phoneNumber = getPhoneNumberByNumber(to);
    if (!phoneNumber) {
      return new NextResponse(
        generateWebhookResponse('vonage', 'reject'),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle different call statuses
    switch (status) {
      case 'ringing':
        return handleIncomingCall(uuid, from, phoneNumber.id);
      
      case 'answered':
        return handleCallAnswered(uuid);
      
      case 'completed':
      case 'failed':
      case 'busy':
      case 'timeout':
        return handleCallEnd(uuid, status);
      
      default:
        console.log('Unknown call status:', status);
        return new NextResponse(JSON.stringify([]), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Vonage webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function handleIncomingCall(uuid: string, from: string, phoneNumberId: string) {
  // Create call session
  const session = createCallSession({
    callSid: uuid,
    phoneNumberId,
    callerNumber: from,
    voipProvider: 'vonage'
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
      generateWebhookResponse('vonage', 'voicemail', { recordCall: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
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
      generateWebhookResponse('vonage', 'answer', { 
        recordCall: true,
        enableAI: true
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Forward to voicemail
  return new NextResponse(
    generateWebhookResponse('vonage', 'voicemail', { recordCall: true }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

async function handleCallAnswered(uuid: string) {
  const session = getCallSessionBySid(uuid);
  if (!session) {
    return new NextResponse(JSON.stringify([]), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Update session status
  updateCallSession(session.id, {
    status: 'in-progress'
  });

  return new NextResponse(JSON.stringify([]), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleCallEnd(uuid: string, status: string) {
  const session = getCallSessionBySid(uuid);
  if (!session) {
    return new NextResponse(JSON.stringify([]), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Calculate duration
  const duration = session.startTime ? 
    Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000) : 0;

  // Map Vonage status to our status
  const mappedStatus = status === 'timeout' ? 'no-answer' : status;

  // Update session with final status
  updateCallSession(session.id, {
    status: mappedStatus as any,
    endTime: new Date(),
    duration
  });

  return new NextResponse(JSON.stringify([]), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return new NextResponse('Vonage Webhook Endpoint Active', { status: 200 });
}
