/**
 * 📞 Custom Voice Call Handler - Process voice calls without external dependencies
 */

import { NextRequest, NextResponse } from 'next/server';
import { logCall, getPrimaryPhoneNumber, getVoiceSettings, isWithinBusinessHours } from '@/lib/phoneSystemService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { callerNumber, message, phoneNumberId } = body;

    // Get the target phone number (use primary if not specified)
    const targetPhone = phoneNumberId 
      ? phoneNumberId 
      : getPrimaryPhoneNumber()?.id;

    if (!targetPhone) {
      return NextResponse.json(
        { success: false, error: 'No phone number configured' },
        { status: 400 }
      );
    }

    // Check business hours
    const withinHours = isWithinBusinessHours(targetPhone);
    const voiceSettings = getVoiceSettings(targetPhone);

    if (!withinHours && voiceSettings?.businessHoursOnly) {
      // Log the call as missed
      logCall({
        phoneNumberId: targetPhone,
        callerNumber: callerNumber || 'Unknown',
        callType: 'incoming',
        duration: 5, // Brief interaction
        timestamp: new Date(),
        handled: false,
        handledBy: 'ai',
        intent: 'other',
        success: false,
        notes: 'Called outside business hours'
      });

      return NextResponse.json({
        success: true,
        response: {
          message: "Thank you for calling! We're currently closed. Please call back during our business hours. You can also visit our website to place an order online.",
          action: 'hangup',
          shouldTransfer: false
        }
      });
    }

    // Process the voice message using our Voice AI Agent logic
    const aiResponse = await processVoiceMessage(message, targetPhone, callerNumber);

    // Log the call
    logCall({
      phoneNumberId: targetPhone,
      callerNumber: callerNumber || 'Unknown',
      callType: 'incoming',
      duration: aiResponse.estimatedDuration,
      timestamp: new Date(),
      handled: true,
      handledBy: aiResponse.handledBy,
      intent: aiResponse.intent,
      success: aiResponse.success,
      notes: aiResponse.notes
    });

    return NextResponse.json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error('Error processing voice call:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process voice call' },
      { status: 500 }
    );
  }
}

async function processVoiceMessage(message: string, phoneNumberId: string, callerNumber: string) {
  const messageLower = message.toLowerCase();
  
  // Intent detection
  const isReservation = messageWithinThreshold(messageLower, [
    'reservation', 'book', 'table', 'reserve', 'seat', 'party'
  ]);
  
  const isOrder = messageWithinThreshold(messageLower, [
    'order', 'food', 'delivery', 'takeout', 'pickup', 'menu'
  ]);

  const isInquiry = messageWithinThreshold(messageLower, [
    'hours', 'open', 'closed', 'time', 'information', 'location', 'address'
  ]);

  // Default response for unclear requests
  if (!isReservation && !isOrder && !isInquiry) {
    return {
      message: "I'd be happy to help you! I can assist with making reservations, taking food orders, or answering questions about our restaurant. What would you like to do today?",
      action: 'continue',
      intent: 'other',
      handledBy: 'ai' as const,
      success: false,
      estimatedDuration: 30,
      shouldTransfer: false,
      notes: 'Unclear initial request'
    };
  }

  // Handle reservations
  if (isReservation) {
    return await handleReservationRequest(message, phoneNumberId, callerNumber);
  }

  // Handle orders
  if (isOrder) {
    return await handleOrderRequest(message, phoneNumberId, callerNumber);
  }

  // Handle inquiries
  if (isInquiry) {
    return await handleInquiryRequest(message, phoneNumberId, callerNumber);
  }

  // Fallback
  return {
    message: "I understand you're looking for assistance. Let me transfer you to one of our staff members who can better help you with your specific request.",
    action: 'transfer',
    intent: 'other',
    handledBy: 'staff' as const,
    success: false,
    estimatedDuration: 15,
    shouldTransfer: true,
    notes: 'Complex request requiring human assistance'
  };
}

async function handleReservationRequest(message: string, phoneNumberId: string, callerNumber: string) {
  // Extract potential details from the message
  const partySize = extractPartySize(message);
  const dateTime = extractDateTime(message);
  const name = extractName(message);

  if (partySize && dateTime && name) {
    // We have all the details, create the reservation
    try {
      await createReservation({
        partySize,
        dateTime,
        customerName: name,
        phoneNumber: callerNumber,
        source: 'phone_call'
      });

      return {
        message: `Perfect! I've booked a table for ${partySize} ${partySize === 1 ? 'person' : 'people'} on ${dateTime} under the name ${name}. Your confirmation number is ${generateConfirmationNumber()}. We look forward to seeing you!`,
        action: 'complete',
        intent: 'reservation',
        handledBy: 'ai' as const,
        success: true,
        estimatedDuration: 120,
        shouldTransfer: false,
        notes: `Reservation created for ${partySize} on ${dateTime}`
      };
    } catch (error) {
      return {
        message: "I apologize, but I'm having trouble creating your reservation right now. Let me transfer you to our staff who can assist you immediately.",
        action: 'transfer',
        intent: 'reservation',
        handledBy: 'staff' as const,
        success: false,
        estimatedDuration: 45,
        shouldTransfer: true,
        notes: 'System error during reservation creation'
      };
    }
  }

  // Missing details, ask for them
  const missingInfo = [];
  if (!partySize) missingInfo.push('party size');
  if (!dateTime) missingInfo.push('date and time');
  if (!name) missingInfo.push('name');

  return {
    message: `I'd be happy to help you make a reservation! I'll need a few details: ${missingInfo.join(', ')}. Could you please provide ${missingInfo[0]}?`,
    action: 'continue',
    intent: 'reservation',
    handledBy: 'ai' as const,
    success: false,
    estimatedDuration: 60,
    shouldTransfer: false,
    notes: `Gathering reservation details, missing: ${missingInfo.join(', ')}`
  };
}

async function handleOrderRequest(message: string, phoneNumberId: string, callerNumber: string) {
  const menuItems = extractMenuItems(message);
  const orderType = extractOrderType(message);

  if (menuItems.length > 0 && orderType) {
    try {
      await createOrder({
        items: menuItems,
        orderType,
        customerPhone: callerNumber,
        source: 'phone_call'
      });

      const itemsText = menuItems.map(item => `${item.quantity}x ${item.name}`).join(', ');
      const total = calculateOrderTotal(menuItems);

      return {
        message: `Great! I have your ${orderType} order: ${itemsText}. Your total is $${total.toFixed(2)}. Your order number is ${generateOrderNumber()}. ${orderType === 'delivery' ? 'We\'ll deliver in 30-45 minutes.' : 'Your order will be ready for pickup in 15-20 minutes.'}`,
        action: 'complete',
        intent: 'order',
        handledBy: 'ai' as const,
        success: true,
        estimatedDuration: 180,
        shouldTransfer: false,
        notes: `Order created: ${itemsText}, Total: $${total.toFixed(2)}`
      };
    } catch (error) {
      return {
        message: "I'm having trouble processing your order right now. Let me transfer you to our staff who can take your order immediately.",
        action: 'transfer',
        intent: 'order',
        handledBy: 'staff' as const,
        success: false,
        estimatedDuration: 60,
        shouldTransfer: true,
        notes: 'System error during order creation'
      };
    }
  }

  return {
    message: "I'd love to take your order! What items would you like, and is this for delivery, pickup, or dine-in?",
    action: 'continue',
    intent: 'order',
    handledBy: 'ai' as const,
    success: false,
    estimatedDuration: 90,
    shouldTransfer: false,
    notes: 'Gathering order details'
  };
}

async function handleInquiryRequest(message: string, phoneNumberId: string, callerNumber: string) {
  const messageKeywords = message.toLowerCase();

  if (messageKeywords.includes('hours') || messageKeywords.includes('open')) {
    return {
      message: "We're open Monday through Thursday 11am to 10pm, Friday and Saturday 10am to 11pm, and Sunday 10am to 9pm. We're currently open and ready to serve you!",
      action: 'complete',
      intent: 'inquiry',
      handledBy: 'ai' as const,
      success: true,
      estimatedDuration: 30,
      shouldTransfer: false,
      notes: 'Provided business hours information'
    };
  }

  if (messageKeywords.includes('location') || messageKeywords.includes('address')) {
    return {
      message: "We're located at 123 Main Street, Downtown. We offer dine-in, takeout, and delivery services. Is there anything else I can help you with?",
      action: 'complete',
      intent: 'inquiry',
      handledBy: 'ai' as const,
      success: true,
      estimatedDuration: 25,
      shouldTransfer: false,
      notes: 'Provided location information'
    };
  }

  if (messageKeywords.includes('menu') || messageKeywords.includes('food')) {
    return {
      message: "We offer a variety of delicious options including pizzas, salads, sandwiches, and daily specials. Would you like me to help you place an order, or would you prefer to speak with our staff about specific menu items?",
      action: 'continue',
      intent: 'inquiry',
      handledBy: 'ai' as const,
      success: true,
      estimatedDuration: 45,
      shouldTransfer: false,
      notes: 'Provided menu information'
    };
  }

  return {
    message: "I can help answer questions about our hours, location, menu, or assist with reservations and orders. What specific information are you looking for?",
    action: 'continue',
    intent: 'inquiry',
    handledBy: 'ai' as const,
    success: false,
    estimatedDuration: 30,
    shouldTransfer: false,
    notes: 'General inquiry response'
  };
}

// Utility functions
function messageWithinThreshold(message: string, keywords: string[], threshold = 0.7): boolean {
  const words = message.split(' ');
  const matches = keywords.filter(keyword => 
    words.some(word => word.includes(keyword) || keyword.includes(word))
  );
  return matches.length > 0;
}

function extractPartySize(message: string): number | null {
  const numbers = message.match(/\b(\d+)\b/g);
  if (numbers) {
    const size = parseInt(numbers[0]);
    return size >= 1 && size <= 20 ? size : null;
  }
  
  const wordNumbers: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };
  
  for (const [word, num] of Object.entries(wordNumbers)) {
    if (message.toLowerCase().includes(word)) {
      return num;
    }
  }
  
  return null;
}

function extractDateTime(message: string): string | null {
  const today = new Date();
  const messageeLower = message.toLowerCase();
  
  if (messageeLower.includes('tonight') || messageeLower.includes('today')) {
    return `today at ${extractTime(message) || '7:00 PM'}`;
  }
  
  if (messageeLower.includes('tomorrow')) {
    return `tomorrow at ${extractTime(message) || '7:00 PM'}`;
  }
  
  const timeMatch = extractTime(message);
  if (timeMatch) {
    return `today at ${timeMatch}`;
  }
  
  return null;
}

function extractTime(message: string): string | null {
  const timeRegex = /\b(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?\b/g;
  const matches = message.match(timeRegex);
  return matches ? matches[0] : null;
}

function extractName(message: string): string | null {
  // Simple name extraction - look for "name is" or "I'm" patterns
  const namePatterns = [
    /name is ([A-Za-z\s]+)/i,
    /i'm ([A-Za-z\s]+)/i,
    /this is ([A-Za-z\s]+)/i,
    /under ([A-Za-z\s]+)/i
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractMenuItems(message: string): Array<{name: string, quantity: number}> {
  const items: Array<{name: string, quantity: number}> = [];
  const menuItems = ['pizza', 'salad', 'sandwich', 'burger', 'pasta', 'chicken', 'fish', 'steak'];
  
  for (const item of menuItems) {
    if (message.toLowerCase().includes(item)) {
      const quantityMatch = message.match(new RegExp(`(\\d+)\\s*${item}`, 'i'));
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      items.push({ name: item, quantity });
    }
  }
  
  return items;
}

function extractOrderType(message: string): 'dine-in' | 'takeout' | 'delivery' | null {
  const messageLower = message.toLowerCase();
  if (messageLower.includes('delivery') || messageLower.includes('deliver')) return 'delivery';
  if (messageLower.includes('pickup') || messageLower.includes('takeout')) return 'takeout';
  if (messageLower.includes('dine') || messageLower.includes('table')) return 'dine-in';
  return null;
}

function calculateOrderTotal(items: Array<{name: string, quantity: number}>): number {
  const prices: Record<string, number> = {
    pizza: 12.99,
    salad: 8.99,
    sandwich: 9.99,
    burger: 11.99,
    pasta: 13.99,
    chicken: 15.99,
    fish: 17.99,
    steak: 19.99
  };
  
  return items.reduce((total, item) => {
    return total + (prices[item.name] || 10.99) * item.quantity;
  }, 0);
}

function generateConfirmationNumber(): string {
  return `RES${Date.now().toString().slice(-6)}`;
}

function generateOrderNumber(): string {
  return `ORD${Date.now().toString().slice(-6)}`;
}

// Mock functions for IOMS integration
async function createReservation(data: any) {
  // In a real implementation, this would save to your IOMS database
  console.log('Creating reservation:', data);
  return { success: true, id: generateConfirmationNumber() };
}

async function createOrder(data: any) {
  // In a real implementation, this would save to your IOMS database
  console.log('Creating order:', data);
  return { success: true, id: generateOrderNumber() };
}
