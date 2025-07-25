/**
 * 📞 Twilio Voice Integration for Voice AI Agent
 * Handles incoming phone calls and connects them to the Voice AI system
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    console.log('📞 Incoming phone call received...');
    
    const formData = await request.formData();
    const callSid = formData.get('CallSid');
    const from = formData.get('From');
    const to = formData.get('To');
    const callStatus = formData.get('CallStatus');
    
    console.log('📞 Call Details:', { callSid, from, to, callStatus });

    const twiml = new VoiceResponse();

    // Welcome message
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Hello! Welcome to our restaurant. I am your AI assistant. How can I help you today?');

    // Start recording for voice processing
    twiml.record({
      timeout: 10,
      transcribe: true,
      transcribeCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/transcribe`,
      action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/process-speech`,
      method: 'POST',
      maxLength: 30
    });

    // Fallback in case no speech is detected
    twiml.say('I didn\'t hear anything. Please try speaking again.');
    twiml.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice`);

    console.log('📞 TwiML Response:', twiml.toString());

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('❌ Error handling Twilio voice call:', error);
    
    const twiml = new VoiceResponse();
    twiml.say('I apologize, but I\'m experiencing technical difficulties. Please try calling again or contact our staff directly.');
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Twilio Voice Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}
