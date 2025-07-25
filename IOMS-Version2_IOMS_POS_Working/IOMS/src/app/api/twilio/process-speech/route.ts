/**
 * 📞 Twilio Speech Processing
 * Processes customer speech and generates AI responses
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Store conversation state in memory (in production, use Redis or database)
const conversationStore = new Map();

interface ConversationState {
  phase: 'greeting' | 'listening' | 'confirming' | 'processing' | 'completed';
  intent: 'order' | 'reservation' | 'inquiry' | 'unknown';
  customerData: {
    name?: string;
    phone?: string;
  };
  orderData: {
    items: Array<{ name: string; quantity: number; specialInstructions?: string }>;
    orderType: 'dine-in' | 'takeout' | 'delivery';
    total?: number;
  };
  reservationData: {
    partySize?: number;
    date?: string;
    time?: string;
    specialRequests?: string;
  };
  transcript: string[];
  attempts: number;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎤 Processing speech from phone call...');
    
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const speechResult = formData.get('SpeechResult') || formData.get('TranscriptionText') as string;
    const confidence = formData.get('Confidence') as string;
    const from = formData.get('From') as string;

    console.log('🎤 Speech Data:', { callSid, speechResult, confidence, from });

    const twiml = new VoiceResponse();

    if (!speechResult || speechResult.trim() === '') {
      twiml.say('I didn\'t catch that. Could you please repeat what you\'d like?');
      twiml.record({
        timeout: 10,
        transcribe: true,
        transcribeCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/transcribe`,
        action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/process-speech`,
        method: 'POST',
        maxLength: 30
      });
      
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Get or create conversation state
    let state = conversationStore.get(callSid) || {
      phase: 'greeting',
      intent: 'unknown',
      customerData: { phone: from },
      orderData: { items: [], orderType: 'dine-in' },
      reservationData: {},
      transcript: [],
      attempts: 0
    };

    state.transcript.push(`Customer: ${speechResult}`);
    state.attempts += 1;

    console.log('🧠 Current state:', state.phase, state.intent);

    // Process the speech based on current phase
    const response = await processCustomerSpeech(speechResult, state);
    
    state.transcript.push(`AI: ${response.message}`);
    conversationStore.set(callSid, state);

    console.log('💬 AI Response:', response.message);

    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, response.message);

    if (response.shouldContinue) {
      // Continue conversation
      twiml.record({
        timeout: 10,
        transcribe: true,
        transcribeCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/transcribe`,
        action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/process-speech`,
        method: 'POST',
        maxLength: 30
      });
      
      // Fallback
      twiml.say('Are you still there?');
      twiml.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/process-speech`);
    } else {
      // End call
      twiml.say('Thank you for calling! Have a wonderful day!');
      twiml.hangup();
      
      // Clean up conversation state
      conversationStore.delete(callSid);
    }

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('❌ Error processing speech:', error);
    
    const twiml = new VoiceResponse();
    twiml.say('I apologize for the technical difficulty. Let me transfer you to our staff.');
    twiml.dial(process.env.RESTAURANT_PHONE_NUMBER || '+1234567890');
    
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}

async function processCustomerSpeech(speechResult: string, state: ConversationState): Promise<{ message: string; shouldContinue: boolean }> {
  const lowerSpeech = speechResult.toLowerCase();

  // Detect intent if unknown
  if (state.intent === 'unknown') {
    if (lowerSpeech.includes('reservation') || lowerSpeech.includes('table') || lowerSpeech.includes('book')) {
      state.intent = 'reservation';
      state.phase = 'listening';
      return {
        message: "I'd be happy to help you with a reservation! How many people will be dining?",
        shouldContinue: true
      };
    } else if (lowerSpeech.includes('order') || lowerSpeech.includes('food') || lowerSpeech.includes('delivery') || lowerSpeech.includes('takeout')) {
      state.intent = 'order';
      state.phase = 'listening';
      return {
        message: "Great! I can help you place an order. What would you like to order today?",
        shouldContinue: true
      };
    } else {
      return {
        message: "How can I help you today? Are you looking to place a food order or make a table reservation?",
        shouldContinue: true
      };
    }
  }

  // Handle reservation flow
  if (state.intent === 'reservation') {
    return await processReservation(speechResult, state);
  }

  // Handle order flow
  if (state.intent === 'order') {
    return await processOrder(speechResult, state);
  }

  // Handle confirmations
  if (state.phase === 'confirming') {
    if (lowerSpeech.includes('yes') || lowerSpeech.includes('correct') || lowerSpeech.includes('confirm')) {
      state.phase = 'processing';
      
      if (state.intent === 'reservation') {
        await createReservation(state);
        return {
          message: `Perfect! Your reservation has been confirmed. Your confirmation number is RES-${Date.now()}. We look forward to seeing you!`,
          shouldContinue: false
        };
      } else if (state.intent === 'order') {
        await createOrder(state);
        return {
          message: `Excellent! Your order has been placed. Your order number is ORD-${Date.now()}. We'll have it ready soon!`,
          shouldContinue: false
        };
      }
    } else if (lowerSpeech.includes('no') || lowerSpeech.includes('wrong') || lowerSpeech.includes('change')) {
      state.phase = 'listening';
      return {
        message: "No problem! What would you like to change?",
        shouldContinue: true
      };
    }
  }

  // Fallback
  return {
    message: "I'm not sure I understood that. Could you please rephrase?",
    shouldContinue: true
  };
}

async function processReservation(speechResult: string, state: ConversationState): Promise<{ message: string; shouldContinue: boolean }> {
  const lowerSpeech = speechResult.toLowerCase();
  
  // Extract party size
  const partySizeMatch = speechResult.match(/(\d+)\s*(people|person|guests?|party)/i);
  if (partySizeMatch && !state.reservationData.partySize) {
    state.reservationData.partySize = parseInt(partySizeMatch[1]);
  }
  
  // Extract time
  const timeMatch = speechResult.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))/i);
  if (timeMatch && !state.reservationData.time) {
    state.reservationData.time = timeMatch[1];
  }
  
  // Extract date
  if ((lowerSpeech.includes('tonight') || lowerSpeech.includes('today')) && !state.reservationData.date) {
    state.reservationData.date = 'today';
  } else if (lowerSpeech.includes('tomorrow') && !state.reservationData.date) {
    state.reservationData.date = 'tomorrow';
  }
  
  // Extract name
  const nameMatch = speechResult.match(/(?:name is|I'm|this is|my name is)\s+([A-Za-z\s]+)/i);
  if (nameMatch && !state.customerData.name) {
    state.customerData.name = nameMatch[1].trim();
  }
  
  // Check what we still need
  const missing = [];
  if (!state.reservationData.partySize) missing.push('party size');
  if (!state.reservationData.date) missing.push('date');
  if (!state.reservationData.time) missing.push('time');
  if (!state.customerData.name) missing.push('name');
  
  if (missing.length === 0) {
    // All info collected, confirm
    state.phase = 'confirming';
    const { partySize, date, time } = state.reservationData;
    const { name } = state.customerData;
    
    return {
      message: `Perfect! I have a reservation for ${partySize} people under ${name} for ${date} at ${time}. Is this correct?`,
      shouldContinue: true
    };
  } else {
    // Ask for missing info
    const questions = {
      'party size': 'How many people will be dining?',
      'date': 'What date would you like the reservation for?',
      'time': 'What time would you prefer?',
      'name': 'Could I get a name for the reservation?'
    };
    
    return {
      message: questions[missing[0]],
      shouldContinue: true
    };
  }
}

async function processOrder(speechResult: string, state: ConversationState): Promise<{ message: string; shouldContinue: boolean }> {
  const lowerSpeech = speechResult.toLowerCase();
  
  // Extract menu items
  const menuItems = ['pizza', 'burger', 'pasta', 'salad', 'sandwich', 'soup', 'steak', 'chicken', 'fish'];
  
  for (const item of menuItems) {
    if (lowerSpeech.includes(item)) {
      const quantityMatch = speechResult.match(new RegExp(`(\\d+)\\s*${item}`, 'i'));
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      // Check if item already exists
      const existingItem = state.orderData.items.find(i => i.name === item);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.orderData.items.push({ name: item, quantity });
      }
    }
  }
  
  // Extract order type
  if (lowerSpeech.includes('delivery')) {
    state.orderData.orderType = 'delivery';
  } else if (lowerSpeech.includes('takeout') || lowerSpeech.includes('pickup')) {
    state.orderData.orderType = 'takeout';
  }
  
  // Extract name
  const nameMatch = speechResult.match(/(?:name is|I'm|this is|my name is)\s+([A-Za-z\s]+)/i);
  if (nameMatch && !state.customerData.name) {
    state.customerData.name = nameMatch[1].trim();
  }
  
  // Check if we have items and name
  if (state.orderData.items.length > 0 && state.customerData.name) {
    // Calculate total
    const itemPrices: Record<string, number> = {
      pizza: 15.99, burger: 12.99, pasta: 14.99, salad: 10.99,
      sandwich: 9.99, soup: 7.99, steak: 24.99, chicken: 18.99, fish: 22.99
    };
    
    let total = 0;
    const itemList = state.orderData.items.map(item => {
      const price = itemPrices[item.name] || 10.99;
      total += price * item.quantity;
      return `${item.quantity} ${item.name}${item.quantity > 1 ? 's' : ''}`;
    }).join(', ');
    
    state.orderData.total = total;
    state.phase = 'confirming';
    
    return {
      message: `Great! I have ${itemList} for ${state.orderData.orderType} under ${state.customerData.name}. The total is $${total.toFixed(2)}. Is this correct?`,
      shouldContinue: true
    };
  } else if (state.orderData.items.length === 0) {
    return {
      message: "What would you like to order? We have pizza, burgers, pasta, salads, and more!",
      shouldContinue: true
    };
  } else {
    return {
      message: "Could I get a name for the order?",
      shouldContinue: true
    };
  }
}

async function createReservation(state: ConversationState) {
  try {
    const reservationData = {
      customer_name: state.customerData.name,
      customer_phone: state.customerData.phone,
      party_size: state.reservationData.partySize,
      reservation_datetime: formatDateTime(state.reservationData.date, state.reservationData.time),
      special_requests: state.reservationData.specialRequests || '',
      source: 'twilio-voice-ai',
      status: 'confirmed'
    };

    console.log('📋 Creating reservation:', reservationData);

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/voice-agent/reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData)
    });

    const result = await response.json();
    console.log('✅ Reservation created:', result);
    
  } catch (error) {
    console.error('❌ Error creating reservation:', error);
  }
}

async function createOrder(state: ConversationState) {
  try {
    const orderData = {
      customer_name: state.customerData.name,
      customer_phone: state.customerData.phone,
      items: state.orderData.items,
      order_type: state.orderData.orderType,
      source: 'twilio-voice-ai',
      status: 'confirmed'
    };

    console.log('🛒 Creating order:', orderData);

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/voice-agent/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    console.log('✅ Order created:', result);
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
  }
}

function formatDateTime(date?: string, time?: string): string {
  const now = new Date();
  let targetDate = new Date();
  
  if (date === 'tomorrow') {
    targetDate.setDate(now.getDate() + 1);
  }
  
  if (time) {
    const timeMatch = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)/);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0');
      const ampm = timeMatch[3].toLowerCase();
      
      if (ampm === 'pm' && hours !== 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      targetDate.setHours(hours, minutes, 0, 0);
    }
  }
  
  return targetDate.toISOString();
}
