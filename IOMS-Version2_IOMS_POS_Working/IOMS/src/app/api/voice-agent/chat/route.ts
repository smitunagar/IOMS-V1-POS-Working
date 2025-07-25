/**
 * 🎤 Voice AI Agent API - Simplified speech-optimized responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { processVoiceOrder } from '@/lib/voiceOrderProcessor';

interface Session {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  lastActivity: Date;
}

// In-memory session storage
const sessions = new Map<string, Session>();

// Simple intent detection
function analyzeMessage(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Order keywords
  const orderKeywords = ['order', 'buy', 'purchase', 'want', 'need', 'get', 'pizza', 'burger', 'food', 'meal', 'drink', 'coffee'];
  const hasOrderKeyword = orderKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Reservation keywords
  const reservationKeywords = ['table', 'reservation', 'book', 'reserve', 'seat', 'party', 'dinner', 'tonight', 'tomorrow'];
  const hasReservationKeyword = reservationKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Greeting keywords
  const greetingKeywords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
  const hasGreeting = greetingKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Time extraction
  const timeMatch = lowerMessage.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|o'clock)?/);
  const dateMatch = lowerMessage.match(/(today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  
  // Party size extraction
  const partySizeMatch = lowerMessage.match(/(\d+)\s*(people|person|guests?|party)/);
  
  // Food items extraction (improved pattern matching) - FIXED to prevent duplicates
  const foodItems: string[] = [];
  const foodPatterns = [
    // Complete dish names first (most specific)
    /(\d+)?\s*([a-z]+\s*){1,3}(biryani|curry|samosa|naan|pizza|burger|sandwich)/g,
    // Standard food items
    /(\d+)?\s*(large|medium|small)?\s*(pizza|burger|sandwich|salad|pasta|coffee|drink|water|soda|fries)/g,
    // Simple ingredients (only if no dish found)
    /(\d+)?\s*(chicken|beef|pork|fish|seafood|salmon|tuna|cheese|veggie)/g
  ];
  
  const foundMatches = new Set<string>(); // CRITICAL FIX: Use Set to prevent duplicates
  let foundCompleteMatch = false; // Prioritize complete dishes over ingredients
  
  // Process patterns in order of specificity
  foodPatterns.forEach((pattern, patternIndex) => {
    const matches = [...lowerMessage.matchAll(pattern)];
    matches.forEach(match => {
      const item = match[0].trim();
      
      // Skip ingredient-only matches if we already found a complete dish
      if (patternIndex === 2 && foundCompleteMatch) {
        console.log(`[Voice Agent] Skipping ingredient "${item}" - already found complete dish`);
        return;
      }
      
      if (item && !foundMatches.has(item)) { // CRITICAL FIX: Only add if not already found
        foundMatches.add(item);
        foodItems.push(item);
        if (patternIndex <= 1) foundCompleteMatch = true; // Mark that we found a complete dish
        console.log(`[Voice Agent] Found food pattern: "${item}" from pattern ${patternIndex + 1}: ${pattern}`);
      }
    });
  });

  // Additional extraction: look for "order" followed by words (only if no patterns matched)
  if (foodItems.length === 0) {
    const orderMatch = lowerMessage.match(/order\s+(.+?)(?:\s+and\s+(.+?))?(?:\s*$|\s+for|\s+at)/);
    if (orderMatch) {
      if (orderMatch[1] && !foundMatches.has(orderMatch[1].trim())) {
        const item = orderMatch[1].trim();
        foundMatches.add(item);
        foodItems.push(item);
        console.log(`[Voice Agent] Found food from order pattern: "${item}"`);
      }
    }
  }

  // Extract words after "want" or "get" (only if no patterns matched)
  if (foodItems.length === 0) {
    const wantMatch = lowerMessage.match(/(?:want|get|have)\s+(?:to\s+order\s+)?(?:a\s+|an\s+|some\s+)?(.+?)(?:\s*$|\s+and|\s+for|\s+at)/);
    if (wantMatch && wantMatch[1] && !foundMatches.has(wantMatch[1].trim())) {
      const item = wantMatch[1].trim();
      foundMatches.add(item);
      foodItems.push(item);
      console.log(`[Voice Agent] Found food from want pattern: "${item}"`);
    }
  }
  
  console.log(`[Voice Agent] ========== EXTRACTION DEBUG ==========`);
  console.log(`[Voice Agent] Input message: "${lowerMessage}"`);
  console.log(`[Voice Agent] Total food items found: ${foodItems.length}`);
  console.log(`[Voice Agent] Food items: [${foodItems.join(', ')}]`);
  console.log(`[Voice Agent] ==========================================`);
  
  let intent = 'general';
  if (hasGreeting && !hasOrderKeyword && !hasReservationKeyword) {
    intent = 'greeting';
  } else if (hasOrderKeyword || foodItems.length > 0) {
    intent = 'order';
  } else if (hasReservationKeyword || partySizeMatch || timeMatch) {
    intent = 'reservation';
  }
  
  return {
    intent,
    extractedInfo: {
      time: timeMatch ? timeMatch[0] : null,
      date: dateMatch ? dateMatch[0] : null,
      partySize: partySizeMatch ? parseInt(partySizeMatch[1]) : null,
      foodItems,
      message: lowerMessage
    }
  };
}

async function processOrder(analysis: any, sessionId: string, userId?: string) {
  try {
    if (!userId) {
      console.log('[Voice Agent] No userId provided for order processing');
      return { success: false, order: null, error: 'User authentication required' };
    }

    console.log('[Voice Agent] Processing order with real menu data');
    console.log('[Voice Agent] Analysis result:', analysis);
    
    // Extract food items from the analysis
    let orderItems = analysis.extractedInfo.foodItems.length > 0 
      ? analysis.extractedInfo.foodItems.map((item: string) => ({
          itemName: item,
          quantity: 1, // Default quantity, could be extracted from speech in the future
          specialInstructions: ''
        }))
      : [];

    console.log('[Voice Agent] Initial extracted items:', orderItems);

    if (orderItems.length === 0) {
      // Try to extract items from the full message if no patterns matched
      const message = analysis.extractedInfo.message;
      console.log('[Voice Agent] No items found in patterns, analyzing full message:', message);
      
      // More comprehensive word extraction - FIXED to prevent duplicates
      const foodWords = ['pizza', 'burger', 'sandwich', 'salad', 'pasta', 'coffee', 'water', 'soda', 'fries', 
                        'samosa', 'curry', 'biryani', 'naan', 'rice', 'soup', 'chicken', 'beef', 'fish',
                        'cheese', 'veggie', 'meat', 'bread', 'drink', 'meal', 'dish', 'plate'];
      
      // Try to find any food-related words in the message
      const words = message.split(/\s+/);
      let foundFoodItem = false;
      
      for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase();
        // Check if this word or combination of words matches food items
        if (foodWords.some(food => word.includes(food) || food.includes(word))) {
          // Try to get context (previous and next words) but only add ONE item
          const context = words.slice(Math.max(0, i-1), Math.min(words.length, i+2)).join(' ');
          
          if (!foundFoodItem) { // CRITICAL FIX: Only add the first food item found
            orderItems.push({
              itemName: context,
              quantity: 1,
              specialInstructions: ''
            });
            foundFoodItem = true;
            console.log(`[Voice Agent] Found food item: "${context}" from word: "${word}"`);
          }
          break; // Exit the loop after finding the first food item
        }
      }

      // If still no items, try to extract everything after key phrases
      if (orderItems.length === 0) {
        const patterns = [
          /(?:order|want|get|have|need)\s+(?:a|an|some|the)?\s*(.+?)(?:\s*$|\s+please|\s+and)/i,
          /(?:i\s*(?:'d|would)\s*like)\s+(?:a|an|some|the)?\s*(.+?)(?:\s*$|\s+please|\s+and)/i
        ];
        
        for (const pattern of patterns) {
          const match = message.match(pattern);
          if (match && match[1]) {
            orderItems.push({
              itemName: match[1].trim(),
              quantity: 1,
              specialInstructions: ''
            });
            break;
          }
        }
      }
    }

    console.log('[Voice Agent] Final extracted items:', orderItems);
    
    // CRITICAL DEBUG: Log each item being sent to order processor
    console.log('[Voice Agent] ========== ORDER PROCESSING DEBUG ==========');
    console.log(`[Voice Agent] Total items extracted: ${orderItems.length}`);
    orderItems.forEach((item: any, index: number) => {
      console.log(`[Voice Agent] Item ${index + 1}:`, {
        itemName: item.itemName,
        quantity: item.quantity,
        quantityType: typeof item.quantity,
        specialInstructions: item.specialInstructions
      });
    });
    console.log('[Voice Agent] ===============================================');

    if (orderItems.length === 0) {
      return { 
        success: false, 
        order: null, 
        error: 'Could not identify any food items in your request. Please specify what you would like to order.' 
      };
    }

    // Create order using the direct voice order processor
    const createOrderResult = await processVoiceOrder({
      userId,
      customerName: 'Voice Customer',
      items: orderItems,
      orderType: 'dine-in', // Default to dine-in, could be determined from speech
      tableId: 't1', // Default table, could be determined from speech
      customerPhone: undefined,
      customerAddress: undefined
    });
    
    if (createOrderResult.success) {
      console.log('[Voice Agent] Order created successfully:', (createOrderResult as any).orderId);
      return {
        success: true,
        order: {
          orderNumber: (createOrderResult as any).orderNumber,
          orderId: (createOrderResult as any).orderId,
          items: (createOrderResult as any).orderDetails.items,
          total: (createOrderResult as any).orderDetails.totalAmount,
          subtotal: (createOrderResult as any).orderDetails.subtotal,
          taxAmount: (createOrderResult as any).orderDetails.taxAmount,
          status: (createOrderResult as any).orderDetails.status,
          table: (createOrderResult as any).orderDetails.table,
          estimatedTime: 15 + ((createOrderResult as any).orderDetails.items.length * 5) // Mock timing
        }
      };
    } else {
      console.log('[Voice Agent] Order creation failed:', (createOrderResult as any).error);
      
      // Try to get more detailed error information
      let detailedError = (createOrderResult as any).error || 'Failed to create order';
      
      // If the create-order API response has suggestions, include them
      if ((createOrderResult as any).suggestions && (createOrderResult as any).suggestions.length > 0) {
        const suggestionNames = (createOrderResult as any).suggestions.map((s: any) => s.name).slice(0, 3);
        if ((createOrderResult as any).unmatchedItems && (createOrderResult as any).unmatchedItems.length > 0) {
          detailedError = `I couldn't find "${(createOrderResult as any).unmatchedItems.join(', ')}" in our menu. Did you mean: ${suggestionNames.join(', ')}?`;
        }
      }
      
      return { 
        success: false, 
        order: null, 
        error: detailedError
      };
    }
  } catch (error) {
    console.error('[Voice Agent] Error processing order:', error);
    return { success: false, order: null, error: 'Failed to process order' };
  }
}

async function processReservation(analysis: any, sessionId: string, userId?: string) {
  try {
    if (!userId) {
      console.log('[Voice Agent] No userId provided for reservation processing');
      return { success: false, reservation: null, error: 'User authentication required' };
    }

    console.log('[Voice Agent] Processing reservation with real table data');
    
    const partySize = analysis.extractedInfo.partySize || 2;
    const date = analysis.extractedInfo.date || 'today';
    const time = analysis.extractedInfo.time || '7:00 PM';

    // Find an available table using the real tables API
    const tablesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003'}/api/voice-agent/tables?userId=${userId}&action=find&partySize=${partySize}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const tablesResult = await tablesResponse.json();
    
    if (!tablesResult.success || !tablesResult.table) {
      return { 
        success: false, 
        reservation: null, 
        error: `Sorry, no available tables for ${partySize} people. Would you like to try a different time?`
      };
    }

    // Create reservation using the real tables API
    const reservationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9003'}/api/voice-agent/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        tableId: tablesResult.table.id,
        action: 'reserve',
        reservationDetails: {
          customerName: 'Voice Customer',
          partySize,
          dateTime: `${date} at ${time}`,
          specialRequests: ''
        }
      })
    });

    const reservationResult = await reservationResponse.json();
    
    if (reservationResult.success) {
      console.log('[Voice Agent] Reservation created successfully:', reservationResult.reservationId);
      return {
        success: true,
        reservation: {
          reservationNumber: reservationResult.reservationId,
          reservationId: reservationResult.reservationId,
          tableId: reservationResult.tableId,
          tableName: tablesResult.table.name,
          partySize,
          date,
          time,
          status: 'confirmed',
          customerName: 'Voice Customer'
        }
      };
    } else {
      console.log('[Voice Agent] Reservation creation failed:', reservationResult.error);
      return { 
        success: false, 
        reservation: null, 
        error: reservationResult.error || 'Failed to create reservation'
      };
    }
  } catch (error) {
    console.error('[Voice Agent] Error processing reservation:', error);
    return { success: false, reservation: null, error: 'Failed to process reservation' };
  }
}

export async function POST(request: NextRequest) {
  console.log('Voice agent API called');
  
  try {
    const body = await request.json();
    const { message, sessionId, isVoice = false, userId } = body;

    console.log('Request body:', { message, sessionId, isVoice, userId });

    if (!message || !sessionId) {
      console.error('Missing required fields:', { message: !!message, sessionId: !!sessionId });
      return NextResponse.json(
        { success: false, error: 'Message and session ID are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      console.warn('No userId provided, using default demo user');
    }

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      console.log('Creating new session:', sessionId);
      session = {
        id: sessionId,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      sessions.set(sessionId, session);
    }

    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    session.lastActivity = new Date();

    // Analyze intent and extract information
    console.log('Analyzing message:', message);
    const analysis = analyzeMessage(message);
    console.log('Analysis result:', analysis);
    
    let response = '';
    let action = null;

    if (analysis.intent === 'order') {
      console.log('Processing order...');
      // Process order - use actual userId or fallback to DEFAULT_USER_ID
      const actualUserId = userId || process.env.DEFAULT_USER_ID || 'user_1752538556589_u705p8e0q';
      const orderResult = await processOrder(analysis, sessionId, actualUserId);
      console.log('Order result:', orderResult);
      
      action = {
        type: 'order',
        data: orderResult.order,
        success: orderResult.success
      };
      
      if (orderResult.success && orderResult.order) {
        response = isVoice 
          ? `Perfect! I've created your order number ${orderResult.order.orderNumber}. Your total is $${orderResult.order.total.toFixed(2)}. The estimated preparation time is ${orderResult.order.estimatedTime} minutes. You can pick it up when it's ready.`
          : `Great! I've created your order #${orderResult.order.orderNumber}.\n\nOrder Details:\n${orderResult.order.items.map((item: any) => `• ${item.quantity}x ${item.name} - $${item.totalPrice.toFixed(2)}`).join('\n')}\n\nTotal: $${orderResult.order.total.toFixed(2)}\nEstimated time: ${orderResult.order.estimatedTime} minutes`;
      } else {
        const errorMsg = orderResult.error || "I couldn't process your order right now.";
        
        // Check if error message includes suggestions
        const hasSuggestions = errorMsg.includes('Did you mean:');
        
        response = isVoice
          ? `I'm sorry, ${errorMsg}${hasSuggestions ? ' Please tell me which one you would like.' : ' Could you please try again or provide more details about what you would like to order?'}`
          : `I apologize, but ${errorMsg}${hasSuggestions ? '\n\nPlease let me know which item you would prefer.' : '\n\nPlease try again or provide more specific details about your order.'}`;
      }
    } else if (analysis.intent === 'reservation') {
      console.log('Processing reservation...');
      // Process reservation - use actual userId or fallback to DEFAULT_USER_ID
      const actualUserId = userId || process.env.DEFAULT_USER_ID || 'user_1752538556589_u705p8e0q';
      const reservationResult = await processReservation(analysis, sessionId, actualUserId);
      console.log('Reservation result:', reservationResult);
      
      action = {
        type: 'reservation',
        data: reservationResult.reservation,
        success: reservationResult.success
      };
      
      if (reservationResult.success && reservationResult.reservation) {
        response = isVoice
          ? `Excellent! I've confirmed your reservation number ${reservationResult.reservation.reservationNumber} for ${reservationResult.reservation.partySize} people on ${reservationResult.reservation.date} at ${reservationResult.reservation.time}. We'll see you then!`
          : `Perfect! Your reservation has been confirmed.\n\nReservation Details:\n• Reservation #: ${reservationResult.reservation.reservationNumber}\n• Party Size: ${reservationResult.reservation.partySize} people\n• Date: ${reservationResult.reservation.date}\n• Time: ${reservationResult.reservation.time}\n• Status: ${reservationResult.reservation.status}`;
      } else {
        const errorMsg = reservationResult.error || "I couldn't make that reservation right now.";
        response = isVoice
          ? `I'm sorry, ${errorMsg} Could you please tell me the number of people, date, and preferred time for your reservation?`
          : `I apologize, but ${errorMsg} Please provide the party size, date, and preferred time for your booking.`;
      }
    } else if (analysis.intent === 'greeting') {
      response = isVoice
        ? "Hello! I'm your voice AI assistant. I can help you place food orders or make table reservations. What would you like to do today?"
        : "Hi there! 👋 I'm your AI assistant and I'm here to help you with:\n\n🍕 **Place Orders** - Tell me what you'd like to eat\n🪑 **Make Reservations** - Book a table for your party\n\nWhat can I help you with today?";
    } else {
      response = isVoice
        ? "I can help you place food orders or make table reservations. What would you like to do?"
        : "I can help you with:\n\n🍕 **Food Orders** - Just tell me what you'd like to order\n🪑 **Table Reservations** - Let me know your party size, date, and time\n\nWhat would you like to do?";
    }

    // Add assistant response to session
    session.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    const responseData = {
      success: true,
      response,
      intent: analysis.intent,
      action,
      session: {
        id: session.id,
        messageCount: session.messages.length
      }
    };

    console.log('Sending response:', responseData);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error in voice AI chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process voice message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Error retrieving voice session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
