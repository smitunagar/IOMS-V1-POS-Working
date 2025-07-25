import { NextRequest, NextResponse } from 'next/server';
import { 
  createCallSession, 
  updateCallSession, 
  getCallSessionBySid,
  initializeAICallProcessor,
  getPhoneNumberByNumber,
  isWithinBusinessHours,
  generateWebhookResponse
} from '@/lib/phoneSystemService';

// ==========================================
// AI AGENT PROCESSING ENDPOINT
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    const {
      CallSid,
      SpeechResult,
      Confidence,
      From,
      To
    } = data as Record<string, string>;

    console.log('AI Agent Processing:', { CallSid, SpeechResult, Confidence });

    // Get the call session
    const session = getCallSessionBySid(CallSid);
    if (!session) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">I'm sorry, there was an error processing your call. Please try again later.</Say>
    <Hangup/>
</Response>`,
        { 
          status: 200,
          headers: { 'Content-Type': 'application/xml' }
        }
      );
    }

    // Process the speech input with AI
    const aiResponse = processAICallInput(session.id, SpeechResult || '', 'customer');
    
    // Generate appropriate response based on AI processing
    let twimlResponse = '';
    
    if (aiResponse.requiresAction) {
      switch (aiResponse.actionType) {
        case 'create_order':
          twimlResponse = handleOrderCreation(session, aiResponse);
          break;
        case 'create_reservation':
          twimlResponse = handleReservationCreation(session, aiResponse);
          break;
        case 'transfer_to_human':
          twimlResponse = handleHumanTransfer(session);
          break;
        default:
          twimlResponse = handleGeneralResponse(aiResponse.response || '');
      }
    } else {
      twimlResponse = handleGeneralResponse(aiResponse.response || '');
    }

    return new NextResponse(twimlResponse, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' }
    });

  } catch (error) {
    console.error('AI Agent processing error:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">I'm experiencing technical difficulties. Let me transfer you to a team member.</Say>
    <Dial>+1234567890</Dial>
</Response>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'application/xml' }
      }
    );
  }
}

function handleOrderCreation(session: any, aiResponse: any): string {
  // Update session to indicate order was created
  updateCallSession(session.id, {
    orderCreated: true,
    customerSatisfaction: 5
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">${aiResponse.response}</Say>
    <Gather input="speech" action="/api/phone/webhooks/twilio/ai-agent" timeout="10" speechTimeout="3">
        <Say voice="Polly.Joanna">Would you like to add anything else to your order, or shall I process this for you?</Say>
    </Gather>
    <Say voice="Polly.Joanna">I didn't hear a response. Let me finalize your order.</Say>
    <Say voice="Polly.Joanna">Perfect! Your order has been placed and will be ready for pickup in 20-25 minutes. Thank you for choosing us!</Say>
    <Hangup/>
</Response>`;
}

function handleReservationCreation(session: any, aiResponse: any): string {
  // Update session to indicate reservation was created
  updateCallSession(session.id, {
    reservationCreated: true,
    customerSatisfaction: 5
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">${aiResponse.response}</Say>
    <Gather input="speech" action="/api/phone/webhooks/twilio/ai-agent" timeout="10" speechTimeout="3">
        <Say voice="Polly.Joanna">Can I get a phone number to confirm your reservation?</Say>
    </Gather>
    <Say voice="Polly.Joanna">Great! Your reservation has been confirmed. We'll see you tonight at 7 PM for 2 people. Thank you!</Say>
    <Hangup/>
</Response>`;
}

function handleHumanTransfer(session: any): string {
  // Update session to indicate human assistance was needed
  updateCallSession(session.id, {
    metadata: {
      ...session.metadata,
      transferHistory: [
        ...(session.metadata.transferHistory || []),
        {
          fromNumber: 'ai-agent',
          toNumber: '+1234567890', // Replace with actual staff number
          timestamp: new Date(),
          reason: 'Customer requested human assistance'
        }
      ]
    }
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Joanna">Let me connect you with one of our team members who can better assist you.</Say>
    <Dial timeout="30" callerId="${session.callerNumber}">
        <Number>+1234567890</Number>
    </Dial>
    <Say voice="Polly.Joanna">I'm sorry, our team is currently unavailable. Please leave a message and we'll call you back.</Say>
    <Record action="/api/phone/webhooks/twilio/voicemail" maxLength="120" finishOnKey="#" />
</Response>`;
}

function handleGeneralResponse(response: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/phone/webhooks/twilio/ai-agent" timeout="10" speechTimeout="3">
        <Say voice="Polly.Joanna">${response}</Say>
    </Gather>
    <Say voice="Polly.Joanna">I didn't catch that. Could you please repeat your request?</Say>
    <Redirect>/api/phone/webhooks/twilio/ai-agent</Redirect>
</Response>`;
}

// Handle GET requests
export async function GET(request: NextRequest) {
  return new NextResponse('AI Agent Endpoint Active', { status: 200 });
}
